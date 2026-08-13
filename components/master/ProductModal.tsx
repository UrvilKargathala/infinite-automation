"use client";

import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useProductStore } from "@/lib/store/useProductStore";
import type { Product } from "@/types";

interface Props {
  open: boolean;
  onClose: () => void;
  product: Product | null;
}

export function ProductModal({ open, onClose, product }: Props) {
  const { add, update, brands, categoriesByBrand } = useProductStore();
  const allBrands = brands();

  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState("");
  const [hsn, setHsn] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [addingNewBrand, setAddingNewBrand] = useState(false);
  const [addingNewCategory, setAddingNewCategory] = useState(false);

  useEffect(() => {
    if (open) {
      if (product) {
        setName(product.name);
        setSku(product.sku);
        setBrand(product.brand);
        setCategory(product.category);
        setHsn(product.hsn);
        setPrice(product.price != null ? String(product.price) : "");
        setStatus(product.status);
      } else {
        setName("");
        setSku("");
        setBrand("");
        setCategory("");
        setHsn("");
        setPrice("");
        setStatus("Active");
      }
      setAddingNewBrand(false);
      setAddingNewCategory(false);
    }
  }, [open, product]);

  const categories = brand ? categoriesByBrand(brand) : [];
  const canSave = name.trim() && brand.trim() && category.trim();

  function handleSave() {
    const data = {
      name: name.trim(),
      sku: sku.trim(),
      brand: brand.trim(),
      category: category.trim(),
      hsn: hsn.trim(),
      price: price.trim() ? Number(price) : null,
      status,
    };
    if (product) {
      update(product.id, data);
    } else {
      add(data);
    }
    onClose();
  }

  const inputClass =
    "w-full bg-white border border-border rounded-lg py-2.5 px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand-blue focus:outline-none transition-colors";
  const labelClass = "block text-sm text-text-primary mb-1";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={product ? "Edit product" : "Add product"}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Save
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className={labelClass}>Product name</label>
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div>
          <label className={labelClass}>SKU</label>
          <input className={inputClass} value={sku} onChange={(e) => setSku(e.target.value)} />
        </div>

        <div>
          <label className={labelClass}>Brand</label>
          {addingNewBrand ? (
            <div className="flex gap-2">
              <input
                className={inputClass}
                placeholder="New brand name"
                value={brand}
                onChange={(e) => { setBrand(e.target.value); setCategory(""); setAddingNewCategory(false); }}
                autoFocus
              />
              <button
                className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1 shrink-0"
                onClick={() => { setAddingNewBrand(false); setBrand(""); setCategory(""); }}
              >
                <ArrowLeft size={14} /> Back
              </button>
            </div>
          ) : (
            <select
              className={inputClass}
              value={brand}
              onChange={(e) => {
                if (e.target.value === "__new__") {
                  setAddingNewBrand(true);
                  setBrand("");
                  setCategory("");
                } else {
                  setBrand(e.target.value);
                  setCategory("");
                  setAddingNewCategory(false);
                }
              }}
            >
              <option value="">Choose brand</option>
              {allBrands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
              <option value="__new__">+ Add new brand</option>
            </select>
          )}
        </div>

        <div>
          <label className={labelClass}>Category</label>
          {addingNewCategory ? (
            <div className="flex gap-2">
              <input
                className={inputClass}
                placeholder="New category name"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                autoFocus
              />
              <button
                className="text-xs text-text-secondary hover:text-text-primary flex items-center gap-1 shrink-0"
                onClick={() => { setAddingNewCategory(false); setCategory(""); }}
              >
                <ArrowLeft size={14} /> Back
              </button>
            </div>
          ) : (
            <select
              className={inputClass}
              value={category}
              onChange={(e) => {
                if (e.target.value === "__new__") {
                  setAddingNewCategory(true);
                  setCategory("");
                } else {
                  setCategory(e.target.value);
                }
              }}
              disabled={!brand}
            >
              <option value="">Choose category</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="__new__">+ Add new category</option>
            </select>
          )}
        </div>

        <div>
          <label className={labelClass}>HSN Code</label>
          <input className={inputClass} value={hsn} onChange={(e) => setHsn(e.target.value)} />
        </div>

        <div>
          <label className={labelClass}>Price (INR)</label>
          <input
            className={inputClass}
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Leave blank if unknown"
          />
        </div>

        <div className="col-span-2">
          <label className={labelClass}>Status</label>
          <select className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as "Active" | "Inactive")}>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>
    </Modal>
  );
}
