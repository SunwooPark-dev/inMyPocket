export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          currency: string
          risk_tolerance: 'low' | 'medium' | 'high'
          created_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          currency?: string
          risk_tolerance?: 'low' | 'medium' | 'high'
          created_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          currency?: string
          risk_tolerance?: 'low' | 'medium' | 'high'
          created_at?: string
        }
      }
      accounts: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'bank' | 'crypto' | 'investment'
          institution_name: string | null
          balance: number
          created_at: string
        }
      }
      assets: {
        Row: {
          id: string
          user_id: string
          account_id: string | null
          ticker: string
          quantity: number
          entry_price: number | null
          current_price: number | null
          last_updated: string
        }
      }
      transactions: {
        Row: {
          id: string
          user_id: string
          account_id: string
          amount: number
          type: 'income' | 'expense' | 'transfer' | 'buy' | 'sell'
          category: string | null
          description: string | null
          executed_at: string
        }
      }
      va_logs: {
        Row: {
          id: string
          user_id: string
          insight_type: string
          message: string
          metadata: Json
          created_at: string
        }
      }
    }
  }
}
