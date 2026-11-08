export const SHOPPING_CATEGORIES = {
  Electronics: {
    subcategories: [
      "Smartphones",
      "Laptops",
      "Tablets",
      "Headphones",
      "Earbuds",
      "Smartwatches",
      "Televisions",
      "Cameras",
      "Gaming",
      "Computer Accessories",
      "Printers",
      "Speakers",
      "Home Appliances",
      "Kitchen Appliances",
      "Other Electronics",
    ],
  },

  Fashion: {
    subcategories: [
      "Men's Clothing",
      "Women's Clothing",
      "Kids' Clothing",
      "Shoes",
      "Sneakers",
      "Sandals",
      "Watches",
      "Bags",
      "Jewellery",
      "Accessories",
      "Ethnic Wear",
      "Sportswear",
    ],
  },

  Beauty: {
    subcategories: [
      "Skincare",
      "Makeup",
      "Haircare",
      "Fragrance",
      "Bath & Body",
      "Beauty Tools",
      "Personal Care",
    ],
  },

  "Home & Kitchen": {
    subcategories: [
      "Furniture",
      "Home Decor",
      "Kitchen",
      "Cookware",
      "Kitchen Appliances",
      "Storage",
      "Lighting",
      "Bedding",
      "Cleaning",
      "Bathroom",
    ],
  },

  "Grocery & Food": {
    subcategories: [
      "Groceries",
      "Snacks",
      "Beverages",
      "Packaged Food",
      "Health Food",
    ],
  },

  "Sports & Fitness": {
    subcategories: [
      "Gym Equipment",
      "Fitness Accessories",
      "Sports Shoes",
      "Cricket",
      "Football",
      "Running",
      "Cycling",
      "Yoga",
      "Outdoor Sports",
    ],
  },

  "Books & Education": {
    subcategories: [
      "Books",
      "Textbooks",
      "Competitive Exams",
      "Stationery",
      "Educational Products",
    ],
  },

  "Toys & Games": {
    subcategories: [
      "Toys",
      "Board Games",
      "Video Games",
      "Gaming Accessories",
      "Educational Toys",
    ],
  },

  "Automotive": {
    subcategories: [
      "Car Accessories",
      "Bike Accessories",
      "Car Care",
      "Helmets",
      "Tools",
    ],
  },

  "Health & Personal Care": {
    subcategories: [
      "Wellness",
      "Personal Care",
      "Fitness",
      "Health Devices",
    ],
  },

  "Baby & Kids": {
    subcategories: [
      "Baby Clothing",
      "Baby Care",
      "Toys",
      "School Supplies",
      "Kids Accessories",
    ],
  },

  Other: {
    subcategories: [
      "Gifts",
      "Office",
      "Travel",
      "Miscellaneous",
    ],
  },
} as const;

export type ShoppingCategory = keyof typeof SHOPPING_CATEGORIES;

export function getAllCategories() {
  return Object.keys(SHOPPING_CATEGORIES);
}