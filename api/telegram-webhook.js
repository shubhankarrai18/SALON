import { Octokit } from '@octokit/rest'

const UPDATE_PRICE_PATTERN =
  /^Update Price:\s*(\d+)\s*->\s*(\d+(?:\.\d{1,2})?)\s*$/i

const DEFAULT_FILE_PATH = 'src/data/content.json'
const DEFAULT_BRANCH = 'main'

function getRequiredEnv(name) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

function getConfig() {
  return {
    telegramToken: getRequiredEnv('TELEGRAM_BOT_TOKEN'),
    githubToken: getRequiredEnv('GITHUB_TOKEN'),
    githubOwner: getRequiredEnv('GITHUB_OWNER'),
    githubRepo: getRequiredEnv('GITHUB_REPO'),
    githubBranch: process.env.GITHUB_BRANCH || DEFAULT_BRANCH,
    githubFilePath: process.env.GITHUB_FILE_PATH || DEFAULT_FILE_PATH,
    allowedChatIds: process.env.TELEGRAM_ALLOWED_CHAT_IDS
      ? process.env.TELEGRAM_ALLOWED_CHAT_IDS.split(',').map((id) => id.trim())
      : null,
  }
}

function parseUpdatePriceCommand(text) {
  if (!text) return null

  const match = text.trim().match(UPDATE_PRICE_PATTERN)
  if (!match) return null

  const serviceId = Number.parseInt(match[1], 10)
  const newPrice = Number.parseFloat(match[2])

  if (!Number.isFinite(serviceId) || serviceId < 1) return null
  if (!Number.isFinite(newPrice) || newPrice < 0) return null

  return { serviceId, newPrice }
}

async function sendTelegramMessage(token, chatId, text) {
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    }),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    throw new Error(`Telegram API error (${response.status}): ${errorBody}`)
  }
}

async function fetchContentFromGitHub(octokit, config) {
  const { data } = await octokit.repos.getContent({
    owner: config.githubOwner,
    repo: config.githubRepo,
    path: config.githubFilePath,
    ref: config.githubBranch,
  })

  if (Array.isArray(data) || !('content' in data) || !('sha' in data)) {
    throw new Error('Expected a single file from GitHub Contents API')
  }

  const decoded = Buffer.from(data.content, 'base64').toString('utf8')
  return {
    sha: data.sha,
    content: JSON.parse(decoded),
  }
}

async function pushContentToGitHub(octokit, config, sha, content, commitMessage) {
  const serialized = `${JSON.stringify(content, null, 2)}\n`
  const encoded = Buffer.from(serialized, 'utf8').toString('base64')

  await octokit.repos.createOrUpdateFileContents({
    owner: config.githubOwner,
    repo: config.githubRepo,
    path: config.githubFilePath,
    message: commitMessage,
    content: encoded,
    sha,
    branch: config.githubBranch,
  })
}

function updateServicePrice(content, serviceId, newPrice) {
  const service = content.services?.find((item) => item.id === serviceId)

  if (!service) {
    throw new Error(`Service with ID ${serviceId} was not found.`)
  }

  const previousPrice = service.price
  service.price = newPrice

  return { service, previousPrice }
}

function isAuthorizedChat(config, chatId) {
  if (!config.allowedChatIds) return true
  return config.allowedChatIds.includes(String(chatId))
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({ error: 'Method not allowed' })
  }

  let config

  try {
    config = getConfig()
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Server is not configured correctly.' })
  }

  const update = req.body
  const message = update?.message
  const chatId = message?.chat?.id
  const text = message?.text

  if (!chatId || !text) {
    return res.status(200).json({ ok: true, ignored: true })
  }

  if (!isAuthorizedChat(config, chatId)) {
    await sendTelegramMessage(
      config.telegramToken,
      chatId,
      'You are not authorized to update salon prices.',
    )
    return res.status(200).json({ ok: true, unauthorized: true })
  }

  const command = parseUpdatePriceCommand(text)

  if (!command) {
    await sendTelegramMessage(
      config.telegramToken,
      chatId,
      [
        'Unrecognized command.',
        '',
        'Use this format:',
        '<code>Update Price: [Service ID] -&gt; [New Price]</code>',
        '',
        'Example:',
        '<code>Update Price: 3 -&gt; 135</code>',
      ].join('\n'),
    )
    return res.status(200).json({ ok: true, invalidCommand: true })
  }

  const octokit = new Octokit({ auth: config.githubToken })

  try {
    const { sha, content } = await fetchContentFromGitHub(octokit, config)
    const { service, previousPrice } = updateServicePrice(
      content,
      command.serviceId,
      command.newPrice,
    )

    const commitMessage = `chore: update "${service.name}" price to ${command.newPrice} via Telegram`

    await pushContentToGitHub(octokit, config, sha, content, commitMessage)

    await sendTelegramMessage(
      config.telegramToken,
      chatId,
      [
        'Price updated successfully.',
        '',
        `<b>Service:</b> ${service.name}`,
        `<b>ID:</b> ${service.id}`,
        `<b>Previous price:</b> ${previousPrice}`,
        `<b>New price:</b> ${service.price}`,
        `<b>Branch:</b> ${config.githubBranch}`,
      ].join('\n'),
    )

    return res.status(200).json({
      ok: true,
      serviceId: service.id,
      previousPrice,
      newPrice: service.price,
    })
  } catch (error) {
    console.error('Webhook processing failed:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred.'

    await sendTelegramMessage(
      config.telegramToken,
      chatId,
      `Failed to update price:\n<code>${errorMessage}</code>`,
    )

    return res.status(500).json({ ok: false, error: errorMessage })
  }
}
