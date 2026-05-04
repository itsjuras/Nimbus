import type { Request, Response, NextFunction } from 'express'

export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message } })
    return
  }

  console.error(err)
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } })
}
