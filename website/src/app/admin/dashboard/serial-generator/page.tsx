import { redirect } from "next/navigation";

export default function SerialGeneratorRedirect() {
  redirect("/admin/dashboard/serial-numbers");
}
