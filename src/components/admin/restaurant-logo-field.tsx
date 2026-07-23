"use client";

import { useState } from "react";
import { ImageUploader } from "@/components/admin/image-uploader";

export function RestaurantLogoField({ initialValue }: { initialValue: string }) {
  const [value, setValue] = useState(initialValue);
  return <div className="md:col-span-2"><p className="mb-2 font-semibold">Logotipo</p><ImageUploader value={value} onChange={setValue} /><input type="hidden" name="logoUrl" value={value} /></div>;
}
