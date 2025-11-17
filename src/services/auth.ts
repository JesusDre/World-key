import { apiRequest } from "./api";

export interface AuthResponseDto {
  token: string;
  fullName: string;
  publicKey: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload extends LoginPayload {
  fullName: string;
  publicKey: string;
}

export async function login(payload: LoginPayload): Promise<AuthResponseDto> {
  return apiRequest<AuthResponseDto>("/auth/login", {
    method: "POST",
    body: payload,
  });
}

export async function register(payload: RegisterPayload): Promise<AuthResponseDto> {
  return apiRequest<AuthResponseDto>("/auth/register", {
    method: "POST",
    body: payload,
  });
}
