import { Link } from "react-router-dom";

const BRANDS = [
  {
    name: "Toyota",
    logo: "/toyota.png",
  },
  {
    name: "Ford",
    logo: "/ford.png",
  },
  {
    name: "Hyundai",
    logo: "/hyunday.png",
  },
  {
    name: "Honda",
    logo: "/honda.png",
  },
  {
    name: "Mazda",
    logo: "/mazda.png",
  },
  {
    name: "Mitsubishi",
    logo: "/mitsubishi.png",
  },
  {
    name: "BMW",
    logo: "/bmw.png",
  },
  {
    name: "KIA",
    logo: "/KIA.png",
  },
  {
    name: "Nissan",
    logo: "/nissan.jpg",
  },
  {
    name: "Vinfast",
    logo: "/vinfast.png",
  },
  {
    name: "Volkswagen",
    logo: "/volkswagen.jpg",
  },
  {
    name: "Volvo",
    logo: "/vonvol.png",
  },
  {
    name: "Peugeot",
    logo: "/peugoot.png",
  },
  {
    name: "Lexus",
    logo: "/lexus.png",
  },
  {
    name: "Audi",
    logo: "/audi.png",
  },
  {
    name: "Chevrolet",
    logo: "/chevelop.png",
  },
  {
    name: "Mercedes",
    logo: "/mercedes.png",
  },
  {
    name: "Isuzu",
    logo: "/isuzu.png",
  },
  {
    name: "Subaru",
    logo: "/subaru.png",
  },
  {
    name: "Suzuki",
    logo: "/suzuki.png",
  },
];

export default function BrandBar() {
  return (
    <section className="bg-white py-8 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-center text-xs font-semibold uppercase tracking-widest text-gray-400 mb-6">
          Tìm theo hãng xe
        </h2>
        <div className="flex flex-wrap justify-center gap-5 items-center">
          {BRANDS.map((brand) => (
            <Link
              key={brand.name}
              to={`/vehicles?brand=${brand.name}`}
              className="flex flex-col items-center gap-2 group"
            >
              <img
                src={brand.logo}
                alt={brand.name}
                className="h-10 w-16 object-contain grayscale group-hover:grayscale-0 transition-all duration-300"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
              <span className="text-xs text-gray-500 group-hover:text-red-600 transition-colors font-medium">
                {brand.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
