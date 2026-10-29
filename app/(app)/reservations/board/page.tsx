import { redirect } from "next/navigation";

/** 예전 주소: 예약관리(시간표)로 보내요. */
export default function BoardPage() {
  redirect("/reservations");
}
