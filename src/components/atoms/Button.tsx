import type { Child, FC } from 'hono/jsx'

export interface ButtonProps {
  children: Child
  variant?: 'primary' | 'secondary'
  size?: 'md' | 'lg'
  name?: string
  value?: string
  autofocus?: boolean
}

/** フォーム送信用ボタン。画面遷移はすべて POST フォームで行う */
export const Button: FC<ButtonProps> = ({ children, variant = 'primary', size = 'md', name, value, autofocus }) => (
  <button type="submit" class={`button button--${variant} button--${size}`} name={name} value={value} autofocus={autofocus}>
    {children}
  </button>
)
