import type { Metadata } from "next";
import { Badge } from "@/components/arc/badge/badge";
import { ProfileScreen } from "@/components/account/ProfileScreen";
import { PageHeader } from "@/components/ui/Table";

export const metadata: Metadata = { title: "Profil · S.T.A.R.S" };

export default function ProfilePage() {
  return (
    <>
      <PageHeader
        title="Profil & Keamanan"
        description="Data akun, identitas karyawan, dan pengelolaan sandi. Profil menyimpan biodata di tabel users + employees; sandi disimpan sebagai hash Argon2 dan tidak pernah dikirim balik ke klien."
        aside={
          <>
            <Badge tone="info" pill>
              Argon2
            </Badge>
            <Badge tone="warning" dot pill>
              reset 30 menit
            </Badge>
          </>
        }
      />

      <ProfileScreen />
    </>
  );
}