# 🪔 চট্টগ্রামের পুজো (Chattogram Puja)

চট্টগ্রামের পূজার সম্পূর্ণ বাংলা পাবলিক ওয়েবসাইট। **Next.js 14, TypeScript, Tailwind CSS, Supabase (ডেটাবেস + লগইন), Leaflet + OpenStreetMap** দিয়ে তৈরি।

![Next.js](https://img.shields.io/badge/Next.js_14-black?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?style=for-the-badge&logo=Leaflet&logoColor=white)

> 📌 *পূর্ণ ধাপে ধাপে গাইড আলাদা পাতায় দেওয়া আছে। এখানে শুধু দ্রুত সারাংশ তুলে ধরা হলো।*

---

## 📁 ফোল্ডারে কী আছে

### ১. প্রজেক্ট ফাইল ও ফোল্ডার
| ফাইল / ফোল্ডার | কাজ ও বিবরণ |
| :--- | :--- |
| `src/app` | পাবলিক পেজ (হোম, মণ্ডপ, ম্যাপ, সময়সূচি, আর্কাইভ, জমা), লগইন, অ্যাডমিন প্যানেল। |
| `src/components` | UI কম্পোনেন্ট (`MandapaGrid`, `BottomNav`, `InstallApp`, `PujaMapEmbed` ইত্যাদি)। |
| `src/lib` | ডেটা ও হেল্পার (`publicData`, `ctgPlaces`, `pujaSchedule`, `pins`, `myMaps`)। |
| `src/middleware.ts` | সেশন ও রুট প্রোটেকশন মিডলওয়্যার। |
| `.env.example` | দুটি env মানের নমুনা। |

### ২. ডাটাবেস স্ক্রিপ্ট (`sql/` ফোল্ডার)
*(Supabase SQL Editor-এ প্রয়োজন অনুযায়ী চালাতে হবে)*

| SQL ফাইল | কাজ ও বিবরণ |
| :--- | :--- |
| `01_policies.sql` | নিরাপত্তা নিয়ম (RLS)। Supabase SQL Editor-এ চালান। |
| `02_make_admin.sql` | নিজের ইমেইল দিয়ে অ্যাডমিন বানানো। |
| `03_first_year.sql` | *(ঐচ্ছিক)* প্রথম পূজাবর্ষ। |
| `07_require_approval.sql` | **(v19)** স্বয়ংক্রিয় প্রকাশ বন্ধ; সব জমা অ্যাডমিন অনুমোদনের পর প্রকাশ হয়। |
| `08_comments_remove_news.sql` | **(v20)** সংবাদ বাদ; মণ্ডপের মন্তব্য, রিপ্লাই ও লাইক। |
| `09_auto_correction...sql` | **(v21)** ভুল সংশোধনের অটো-আপডেট এবং সাধারণ মতামত ও কমেন্টস। |
| `10_admin_only_replies...sql` | **(v29)** রিপ্লাই শুধু অ্যাডমিনের; ওয়েবসাইট লাইক। |
| `13_add_missing_mandapas.sql` | **(v52)** ম্যাপের ৭টি বাদ পড়া মণ্ডপ যোগ (মোট ১২০)। |
| `15_sync_with_map_v57.sql` | **(v57)** Google My Maps KMZ-এর সব ২৫৯টি মণ্ডপ (মহানগর ১৭৯, উত্তর ৩৩, দক্ষিণ ৪৭) সাইটের ডাটাবেসে হুবহু মেলায়। |

---

## ⚙️ সেটআপ ও কনফিগারেশন

### 🔑 env মান (Vercel-এ বসাতে হবে)
```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
