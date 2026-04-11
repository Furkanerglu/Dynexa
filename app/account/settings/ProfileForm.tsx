"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, User, Lock, Eye, EyeOff } from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır"),
  phone: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Mevcut şifrenizi giriniz"),
    newPassword: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
    confirmPassword: z.string().min(6, "Şifre en az 6 karakter olmalıdır"),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Şifreler eşleşmiyor",
    path: ["confirmPassword"],
  });

type ProfileData = z.infer<typeof profileSchema>;
type PasswordData = z.infer<typeof passwordSchema>;

interface Props {
  initialName: string;
  initialPhone: string;
  email: string;
  hasPassword: boolean;
}

export default function ProfileForm({ initialName, initialPhone, email, hasPassword }: Props) {
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: initialName, phone: initialPhone },
  });

  const passwordForm = useForm<PasswordData>({
    resolver: zodResolver(passwordSchema),
  });

  const onProfileSubmit = async (data: ProfileData) => {
    setProfileLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Bilgileriniz güncellendi");
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Bir hata oluştu");
    } finally {
      setProfileLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordData) => {
    setPasswordLoading(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: data.currentPassword, newPassword: data.newPassword }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success("Şifreniz değiştirildi");
      passwordForm.reset();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Bir hata oluştu");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Kişisel Bilgiler */}
      <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
        <h2 className="text-white font-bold flex items-center gap-2 mb-6">
          <User size={18} className="text-[#FF6B35]" />
          Kişisel Bilgiler
        </h2>

        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          {/* E-posta (salt okunur) */}
          <div>
            <label className="text-white/60 text-sm mb-1.5 block">E-posta Adresi</label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/40 text-sm cursor-not-allowed"
            />
            <p className="text-white/30 text-xs mt-1">E-posta adresi değiştirilemez</p>
          </div>

          {/* İsim */}
          <div>
            <label className="text-white/60 text-sm mb-1.5 block">Ad Soyad</label>
            <input
              {...profileForm.register("name")}
              type="text"
              placeholder="Ad Soyad"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none transition-colors text-sm"
            />
            {profileForm.formState.errors.name && (
              <p className="text-red-400 text-xs mt-1">{profileForm.formState.errors.name.message}</p>
            )}
          </div>

          {/* Telefon */}
          <div>
            <label className="text-white/60 text-sm mb-1.5 block">Telefon Numarası</label>
            <input
              {...profileForm.register("phone")}
              type="tel"
              placeholder="05XX XXX XX XX"
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none transition-colors text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={profileLoading}
            className="px-6 py-2.5 bg-[#FF6B35] hover:bg-[#ff5a1f] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 text-sm"
          >
            {profileLoading && <Loader2 size={14} className="animate-spin" />}
            Kaydet
          </button>
        </form>
      </div>

      {/* Şifre Değiştir */}
      {hasPassword && (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <h2 className="text-white font-bold flex items-center gap-2 mb-6">
            <Lock size={18} className="text-[#FF6B35]" />
            Şifre Değiştir
          </h2>

          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            {/* Mevcut Şifre */}
            <div>
              <label className="text-white/60 text-sm mb-1.5 block">Mevcut Şifre</label>
              <div className="relative">
                <input
                  {...passwordForm.register("currentPassword")}
                  type={showCurrent ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none transition-colors text-sm pr-12"
                />
                <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showCurrent ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordForm.formState.errors.currentPassword && (
                <p className="text-red-400 text-xs mt-1">{passwordForm.formState.errors.currentPassword.message}</p>
              )}
            </div>

            {/* Yeni Şifre */}
            <div>
              <label className="text-white/60 text-sm mb-1.5 block">Yeni Şifre</label>
              <div className="relative">
                <input
                  {...passwordForm.register("newPassword")}
                  type={showNew ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none transition-colors text-sm pr-12"
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordForm.formState.errors.newPassword && (
                <p className="text-red-400 text-xs mt-1">{passwordForm.formState.errors.newPassword.message}</p>
              )}
            </div>

            {/* Şifre Tekrar */}
            <div>
              <label className="text-white/60 text-sm mb-1.5 block">Yeni Şifre Tekrar</label>
              <div className="relative">
                <input
                  {...passwordForm.register("confirmPassword")}
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/20 focus:border-[#FF6B35] focus:outline-none transition-colors text-sm pr-12"
                />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {passwordForm.formState.errors.confirmPassword && (
                <p className="text-red-400 text-xs mt-1">{passwordForm.formState.errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={passwordLoading}
              className="px-6 py-2.5 bg-[#FF6B35] hover:bg-[#ff5a1f] disabled:opacity-50 text-white font-semibold rounded-xl transition-colors flex items-center gap-2 text-sm"
            >
              {passwordLoading && <Loader2 size={14} className="animate-spin" />}
              Şifreyi Güncelle
            </button>
          </form>
        </div>
      )}

      {!hasPassword && (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6">
          <p className="text-white/40 text-sm flex items-center gap-2">
            <Lock size={16} />
            Bu hesap Google ile oluşturulmuş. Şifre değişikliği yapılamaz.
          </p>
        </div>
      )}
    </div>
  );
}
