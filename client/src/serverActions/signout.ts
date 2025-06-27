import { signOut } from "next-auth/react";

export function signOutAction() {
  signOut();
}
