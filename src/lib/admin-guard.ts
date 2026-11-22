import { notFound } from "@tanstack/react-router";
import { verifyAdminAccess } from "./admin-api";

export async function guardAdminPage() {
  try {
    await verifyAdminAccess();
  } catch {
    throw notFound();
  }
}