import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ status: "success", message: "Logout berhasil" });
  response.cookies.set("wallet_session", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
  });
  return response;
}
