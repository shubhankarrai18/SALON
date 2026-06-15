import { Octokit } from '@octokit/rest'

const UPDATE_PRICE_PATTERN =
  /^Update Price:\s*(\d+)\s*->\s*(\d+(?:\.\d{1,2})?)\s*$/i

const UPDATE_TEXT_PATTERN = /^Update Text:\s*(\w+)\s*->\s*(.+)$/i

const UPDATE_HOUR_PATTERN = /^Update Hour:\s*(.+?)\s*->\s*(.+)$/i

const ALLOWED_TEXT_KEYS = new Set([
  'salonName',
  'heroTitle',
  'heroSubtitle',
  'phone',
  'address',
])

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

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function parseCommand(text) {
  if (!text) return null

  const trimmed = text.trim()

  const priceMatch = trimmed.match(UPDATE_PRICE_PATTERN)
  if (priceMatch) {
    const serviceId = Number.parseInt(priceMatch[1], 10)
    const newPrice = Number.parseFloat(priceMatch[2])

    if (!Number.isFinite(serviceId) || serviceId < 1) return null
    if (!Number.isFinite(newPrice) || newPrice < 0) return null

    return { type: 'price', serviceId, newPrice }
  }

  const textMatch = trimmed.match(UPDATE_TEXT_PATTERN)
  if (textMatch) {
    const key = textMatch[1]
    const newValue = textMatch[2].trim()

    if (!ALLOWED_TEXT_KEYS.has(key) || !newValue) return null

    return { type: 'text', key, newValue }
  }

  const hourMatch = trimmed.match(UPDATE_HOUR_PATTERN)
  if (hourMatch) {
    const day = hourMatch[1].trim()
    const newHours = hourMatch[2].trim()

    if (!day || !newHours) return null

    return { type: 'hour', day, newHours }
  }

  return null
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

  return {
    commitMessage: `chore: update "${service.name}" price to ${newPrice} via Telegram`,
    replyLines: [
      'Price updated successfully.',
      '',
      `<b>Service:</b> ${escapeHtml(service.name)}`,
      `<b>ID:</b> ${service.id}`,
      `<b>Previous price:</b> ${previousPrice}`,
      `<b>New price:</b> ${service.price}`,
    ],
  }
}

function updateTextField(content, key, newValue) {
  if (!Object.hasOwn(content, key)) {
    throw new Error(`Key "${key}" was not found in content.json.`)
  }

  const previousValue = content[key]
  content[key] = newValue

  return {
    commitMessage: `chore: update ${key} via Telegram`,
    replyLines: [
      'Text updated successfully.',
      '',
      `<b>Key:</b> ${escapeHtml(key)}`,
      `<b>Previous value:</b> ${escapeHtml(previousValue)}`,
      `<b>New value:</b> ${escapeHtml(newValue)}`,
    ],
  }
}

function findBusinessHoursEntry(content, day) {
  const { businessHours } = content

  if (Array.isArray(businessHours)) {
    return businessHours.find(
      (entry) => entry.day?.toLowerCase() === day.toLowerCase(),
    )
  }

  if (businessHours && typeof businessHours === 'object') {
    const objectKey = Object.keys(businessHours).find(
      (key) => key.toLowerCase() === day.toLowerCase(),
    )

    if (!objectKey) return null

    return {
      objectKey,
      day: objectKey.charAt(0).toUpperCase() + objectKey.slice(1),
      hours: businessHours[objectKey],
      isObjectFormat: true,
    }
  }

  return null
}

function updateBusinessHours(content, day, newHours) {
  const entry = findBusinessHoursEntry(content, day)

  if (!entry) {
    throw new Error(`Day "${day}" was not found in businessHours.`)
  }

  const previousHours = entry.hours

  if (entry.isObjectFormat) {
    content.businessHours[entry.objectKey] = newHours
  } else {
    entry.hours = newHours
  }

  const displayDay = entry.isObjectFormat ? entry.day : entry.day

  return {
    commitMessage: `chore: update ${displayDay} hours via Telegram`,
    replyLines: [
      'Business hours updated successfully.',
      '',
      `<b>Day:</b> ${escapeHtml(displayDay)}`,
      `<b>Previous hours:</b> ${escapeHtml(previousHours)}`,
      `<b>New hours:</b> ${escapeHtml(newHours)}`,
    ],
  }
}

function applyCommand(content, command) {
  switch (command.type) {
    case 'price':
      return updateServicePrice(content, command.serviceId, command.newPrice)
    case 'text':
      return updateTextField(content, command.key, command.newValue)
    case 'hour':
      return updateBusinessHours(content, command.day, command.newHours)
    default:
      throw new Error('Unsupported command type.')
  }
}

function isAuthorizedChat(config, chatId) {
  if (!config.allowedChatIds) return true
  return config.allowedChatIds.includes(String(chatId))
}

function getHelpMessage() {
  return [
    'Unrecognized command.',
    '',
    'Supported formats:',
    '<code>Update Price: [Service ID] -&gt; [New Price]</code>',
    '<code>Update Text: [Key] -&gt; [New Text]</code>',
    '<code>Update Hour: [Day] -&gt; [New Hours]</code>',
    '',
    'Examples:',
    '<code>Update Price: 3 -&gt; 135</code>',
    '<code>Update Text: salonName -&gt; Luxe Hair Studio</code>',
    '<code>Update Hour: Monday -&gt; 10:00 AM – 6:00 PM</code>',
    '',
    'Allowed text keys:',
    '<code>salonName, heroTitle, heroSubtitle, phone, address</code>',
  ].join('\n')
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
      'You are not authorized to update salon content.',
    )
    return res.status(200).json({ ok: true, unauthorized: true })
  }

  const command = parseCommand(text)

  if (!command) {
    await sendTelegramMessage(config.telegramToken, chatId, getHelpMessage())
    return res.status(200).json({ ok: true, invalidCommand: true })
  }

  const octokit = new Octokit({ auth: config.githubToken })

  try {
    const { sha, content } = await fetchContentFromGitHub(octokit, config)
    const { commitMessage, replyLines } = applyCommand(content, command)

    await pushContentToGitHub(octokit, config, sha, content, commitMessage)

    await sendTelegramMessage(
      config.telegramToken,
      chatId,
      [...replyLines, `<b>Branch:</b> ${escapeHtml(config.githubBranch)}`].join('\n'),
    )

    return res.status(200).json({ ok: true, command: command.type })
  } catch (error) {
    console.error('Webhook processing failed:', error)

    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred.'

    await sendTelegramMessage(
      config.telegramToken,
      chatId,
      `Failed to apply update:\n<code>${escapeHtml(errorMessage)}</code>`,
    )

    return res.status(500).json({ ok: false, error: errorMessage })
  }
}
