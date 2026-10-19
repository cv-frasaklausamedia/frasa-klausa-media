import { connection } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { KeyRound, User } from 'lucide-react';
import { ProfileNameForm } from './profile-name-form';
import { PasswordForm } from './password-form';
import { AvatarUploadCard } from './avatar-upload-card';

export async function ProfileContent() {
  await connection();
  const user = await requireAdmin();

  return (
    <div className="grid gap-6 md:grid-cols-12">
      {/* Kolom Kiri: Avatar Upload */}
      <div className="md:col-span-4">
        <Card className="h-full">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Foto Profil</CardTitle>
            <CardDescription className="text-xs">
              Foto akan tampil di sudut navbar dan log aktivitas sistem.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AvatarUploadCard
              currentAvatarUrl={user.avatarUrl}
              fullName={user.fullName}
            />
          </CardContent>
        </Card>
      </div>

      {/* Kolom Kanan: Identitas & Kata Sandi Tabs */}
      <div className="md:col-span-8">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold">Pengaturan Akun</CardTitle>
            <CardDescription className="text-xs">
              Perbarui nama tampilan atau perbarui kata sandi akun Anda.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="identity" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="identity" className="gap-2">
                  <User className="h-4 w-4" /> Data Identitas
                </TabsTrigger>
                <TabsTrigger value="security" className="gap-2">
                  <KeyRound className="h-4 w-4" /> Keamanan & Sandi
                </TabsTrigger>
              </TabsList>

              <TabsContent value="identity" className="space-y-4">
                <ProfileNameForm
                  initialFullName={user.fullName}
                  email={user.email}
                />
              </TabsContent>

              <TabsContent value="security" className="space-y-4">
                <PasswordForm />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
