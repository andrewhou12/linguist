import kuromoji, { type Tokenizer, type IpadicFeatures } from 'kuromoji'

let tokenizer: Tokenizer<IpadicFeatures> | null = null
let tokenizerPromise: Promise<Tokenizer<IpadicFeatures>> | null = null

export function isTokenizerReady(): boolean {
  return tokenizer !== null
}

export async function getTokenizer(): Promise<Tokenizer<IpadicFeatures>> {
  if (tokenizer) return tokenizer

  if (!tokenizerPromise) {
    tokenizerPromise = new Promise<Tokenizer<IpadicFeatures>>((resolve, reject) => {
      kuromoji
        .builder({ dicPath: '/dict/' })
        .build((err, built) => {
          if (err) {
            tokenizerPromise = null
            reject(err)
          } else {
            tokenizer = built
            resolve(built)
          }
        })
    })
  }

  return tokenizerPromise
}

export interface TokenResult {
  surface: string
  reading: string | undefined
  pos: string
  posDetail: string
  baseForm: string | undefined
  isContentWord: boolean
}

const CONTENT_POS = new Set(['名詞', '動詞', '形容詞', '副詞', '形容動詞', '連体詞'])

export async function tokenizeJapanese(text: string): Promise<TokenResult[]> {
  const t = await getTokenizer()
  const tokens = t.tokenize(text)

  return tokens.map((token) => ({
    surface: token.surface_form,
    reading: token.reading !== '*' ? token.reading : undefined,
    pos: token.pos,
    posDetail: [token.pos_detail_1, token.pos_detail_2, token.pos_detail_3]
      .filter((d) => d !== '*')
      .join('/'),
    baseForm: token.basic_form !== '*' ? token.basic_form : undefined,
    isContentWord: CONTENT_POS.has(token.pos),
  }))
}
