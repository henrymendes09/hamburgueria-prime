export type ProductAddonOption = {
  id: string;
  name: string;
  price: number;
  type: string;
};

export type ProductCardData = {
  id: string;
  name: string;
  slug: string;
  description: string;
  ingredients: string;
  image: string;
  price: number;
  promoPrice: number | null;
  available: boolean;
  featured: boolean;
  rating: number;
  soldCount: number;
  categoryId: string;
  category?: { name: string; slug: string };
  addons: ProductAddonOption[];
  isFavorited?: boolean;
};
