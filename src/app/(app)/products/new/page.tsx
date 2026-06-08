import Link from "next/link";
import { ProductsPage } from "@/components/products-page";
import { Button } from "@/components/ui/button";

export default function NewProductPage() {
  return (
    <>
      <div className="flex justify-end">
        <Link href="/products"><Button variant="secondary">Back to products</Button></Link>
      </div>
      <ProductsPage initiallyOpen />
    </>
  );
}
