export const CATEGORIES = [
  { id: "food",          label: "საკვები",       icon: "🛒", color: "#4CAF82" },
  { id: "transport",     label: "ტრანსპორტი",   icon: "🚌", color: "#4A90D9" },
  { id: "car",           label: "მანქანა",       icon: "🚗", color: "#3B82F6" },
  { id: "fuel",          label: "საწვავი",       icon: "⛽", color: "#F97316" },
  { id: "entertainment", label: "გართობა",       icon: "🎬", color: "#E07B54" },
  { id: "health",        label: "ჯანმრთელობა", icon: "💊", color: "#E05470" },
  { id: "clothes",       label: "ტანსაცმელი",   icon: "👕", color: "#9B59B6" },
  { id: "utilities",     label: "კომუნალური",   icon: "💡", color: "#F39C12" },
  { id: "education",     label: "განათლება",     icon: "📚", color: "#1ABC9C" },
  { id: "other",         label: "სხვა",           icon: "📦", color: "#95A5A6" },
];

export const INCOME_CATEGORIES = [
  { id: "salary",     label: "ხელფასი",    icon: "💼", color: "#4CAF82" },
  { id: "bonus",      label: "ბონუსი",     icon: "🎁", color: "#F59E0B" },
  { id: "freelance",  label: "ფრილანსი",  icon: "💻", color: "#4A90D9" },
  { id: "business",   label: "ბიზნესი",   icon: "🏢", color: "#A78BFA" },
  { id: "investment", label: "ინვესტიცია", icon: "📈", color: "#1ABC9C" },
  { id: "gift",       label: "საჩუქარი",  icon: "🎀", color: "#E07B54" },
  { id: "rental",     label: "ქირა",       icon: "🏠", color: "#E05470" },
  { id: "other_inc",  label: "სხვა",       icon: "💰", color: "#95A5A6" },
];

export const MONTHS_GE = [
  "იანვარი","თებერვალი","მარტი","აპრილი","მაისი","ივნისი",
  "ივლისი","აგვისტო","სექტემბერი","ოქტომბერი","ნოემბერი","დეკემბერი"
];

export const SUB_CATEGORIES = ["ყველა","მუსიკა","ვიდეო","ღრუბელი","თამაშები","სპორტი","სხვა"];

export const PLANS = [
  {
    id: "free", name: "უფასო", price: 0, priceLabel: "უფასოდ",
    color: "#4CAF82",
    features: [
      { text: "100 ტრანზაქცია/თვე",          ok: true  },
      { text: "3 შენახვის მიზანი",            ok: true  },
      { text: "ბაზისური ანალიტიკა",           ok: true  },
      { text: "AI ფინანსური მრჩეველი",        ok: false },
      { text: "განმეორებადი ტრანზაქციები",         ok: false },
      { text: "PDF/Excel ექსპორტი",           ok: false },
      { text: "ბიუჯეტის სმარტ-გაფრთხილება", ok: false },
      { text: "ჩვევის ანალიზი",               ok: false },
    ]
  },
  {
    id: "pro", name: "Pro", price: 3.99, priceLabel: "3.99 ₾/თვე",
    color: "#A78BFA", badge: "პოპულარული",
    features: [
      { text: "ულიმიტო ტრანზაქციები",         ok: true  },
      { text: "ულიმიტო მიზნები",              ok: true  },
      { text: "სრული ანალიტიკა + ტრენდები",  ok: true  },
      { text: "AI ფინანსური მრჩეველი",        ok: true  },
      { text: "განმეორებადი ტრანზაქციები",         ok: true  },
      { text: "PDF/Excel ექსპორტი",           ok: true  },
      { text: "ბიუჯეტის სმარტ-გაფრთხილება", ok: true  },
      { text: "ჩვევის ანალიზი",               ok: false },
    ]
  },
  {
    id: "elite", name: "Elite", price: 7.99, priceLabel: "7.99 ₾/თვე",
    color: "#F59E0B", badge: "სრული",
    features: [
      { text: "Pro-ს ყველაფერი",           ok: true },
      { text: "ჩვევის ანალიზი",             ok: true },
      { text: "ოჯახის 3 ანგარიში",          ok: true },
      { text: "პრიორიტეტული მხარდაჭერა",  ok: true },
      { text: "ადრეული ახალი ფუნქციები",   ok: true },
      { text: "ყოველწლიური ანგარიში",      ok: true },
      { text: "კრიპტო ხარჯების თვალყური", ok: true },
      { text: "პერსონალური ფინ. გეგმა",   ok: true },
    ]
  }
];
