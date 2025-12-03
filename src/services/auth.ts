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

export interface GoogleLoginPayload {
  token: string;
}

export interface GoogleRegisterPayload {
  token: string;
  publicKey: string;
}

export async function googleLogin(payload: GoogleLoginPayload): Promise<AuthResponseDto> {
  return apiRequest<AuthResponseDto>("/auth/google-login", {
    method: "POST",
    body: payload,
  });
}

export async function googleRegister(payload: GoogleRegisterPayload): Promise<AuthResponseDto> {
  return apiRequest<AuthResponseDto>("/auth/google-register", {
    method: "POST",
    body: payload,
  });
}
