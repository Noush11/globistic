export const metadata = { title: "About" };

export default function AboutPage() {
  return (
    <div className="container-px py-16">
      <h1 className="text-3xl font-bold">About Globistic</h1>
      <div className="prose mt-6 max-w-2xl text-slate-600 dark:text-slate-300">
        <p>
          Globistic is a custom apparel printing platform built for creators, teams, and brands.
          Our online design studio lets you upload artwork, add text, and place your designs
          precisely on t-shirts, hoodies, sweatshirts, and long sleeve shirts — with a live
          preview every step of the way.
        </p>
        <p className="mt-4">
          Every order is printed on premium garments and shipped fast. Secure payments are
          processed through Square, and your artwork is stored safely in the cloud.
        </p>
      </div>
    </div>
  );
}
