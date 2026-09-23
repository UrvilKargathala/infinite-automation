"use client";

import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useProductStore } from "@/lib/store/useProductStore";
import { CURRENCIES, CURRENCY_CODES, type CurrencyCode } from "@/lib/utils/currency";
import type { Product } from "@/types";

function PriceEditor({ prices, onChange, inputClass }: { prices: Partial<Record<CurrencyCode, string>>; onChange: (p: Partial<Record<CurrencyCode, string>>) => void; inputClass: string }) {
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>("INR");
  const [priceValue, setPriceValue] = useState("");

  const setCurrencies = Object.keys(prices).filter((c) => prices[c as CurrencyCode] !== undefined && prices[c as CurrencyCode] !== "") as CurrencyCode[];
  const availableCurrencies = CURRENCY_CODES.filter((c) => !setCurrencies.includes(c));

  useEffect(() => {
    if (availableCurrencies.length > 0 && !availableCurrencies.includes(selectedCurrency)) {
      setSelectedCurrency(availableCurrencies[0]);
    }
  }, [availableCurrencies, selectedCurrency]);

  function handleAdd() {
    if (!priceValue.trim() || isNaN(Number(priceValue))) return;
    onChange({ ...prices, [selectedCurrency]: priceValue });
    setPriceValue("");
    const remaining = CURRENCY_CODES.filter((c) => c !== selectedCurrency && !setCurrencies.includes(c));
    if (remaining.length > 0) setSelectedCurrency(remaining[0]);
  }

  function handleRemove(c: CurrencyCode) {
    const next = { ...prices };
    delete next[c];
    onChange(next);
  }

  return (
    <div className="space-y-2">
      {setCurrencies.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {setCurrencies.map((c) => (
            <div key={c} className="flex items-center gap-1.5 bg-surface-alt border border-border rounded-lg px-3 py-1.5">
              <span className="text-xs text-text-muted">{CURRENCIES[c].symbol}</span>
              <input
                type="number"
                className="w-20 bg-transparent text-sm text-text-primary focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                value={prices[c] ?? ""}
                onChange={(e) => onChange({ ...prices, [c]: e.target.value })}
              />
              <span className="text-xs text-text-muted">{c}</span>
              <button type="button" onClick={() => handleRemove(c)} className="text-text-muted hover:text-danger ml-1 text-sm leading-none">&times;</button>
            </div>
          ))}
        </div>
      )}
      {availableCurrencies.length > 0 && (
        <div className="flex items-center gap-2">
          <select
            className={`${inputClass} !w-auto min-w-[120px]`}
            value={selectedCurrency}
            onChange={(e) => setSelectedCurrency(e.target.value as CurrencyCode)}
          >
            {availableCurrencies.map((c) => (
              <option key={c} value={c}>{c} ({CURRENCIES[c].symbol})</option>
            ))}
          </select>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-muted">{CURRENCIES[selectedCurrency].symbol}</span>
            <input
              className={`${inputClass} pl-9`}
              type="number"
              placeholder="Price"
              value={priceValue}
              onChange={(e) => setPriceValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAdd(); } }}
            />
          </div>
          <button
            type="button"
            onClick={handleAdd}
            disabled={!priceValue.trim()}
            className="px-3 py-2.5 rounded-lg text-sm text-white bg-brand-blue hover:bg-brand-blue/90 disabled:opacity-40 transition-colors shrink-0"
          >
            + Add
          </button>
        </div>
      )}
    </div>
  );
}

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
  const [description, setDescription] = useState("");
  const [prices, setPrices] = useState<Partial<Record<CurrencyCode, string>>>({});
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
        setDescription(product.description || "");
        const p: Partial<Record<CurrencyCode, string>> = {};
        for (const [c, v] of Object.entries(product.prices ?? {})) {
          p[c as CurrencyCode] = String(v);
        }
        if (Object.keys(p).length === 0 && product.price != null) {
          p.INR = String(product.price);
        }
        setPrices(p);
        setStatus(product.status);
      } else {
        setName("");
        setSku("");
        setBrand("");
        setCategory("");
        setHsn("");
        setDescription("");
        setPrices({});
        setStatus("Active");
      }
      setAddingNewBrand(false);
      setAddingNewCategory(false);
    }
  }, [open, product]);

  const categories = brand ? categoriesByBrand(brand) : [];
  const canSave = name.trim() && brand.trim() && category.trim();

  async function handleSave() {
    const parsedPrices: Partial<Record<CurrencyCode, number>> = {};
    for (const [c, v] of Object.entries(prices)) {
      const n = v ? Number(v) : NaN;
      if (!isNaN(n) && v?.trim()) parsedPrices[c as CurrencyCode] = n;
    }
    const data = {
      name: name.trim(),
      sku: sku.trim(),
      brand: brand.trim(),
      category: category.trim(),
      hsn: hsn.trim(),
      description: description.trim(),
      price: parsedPrices.INR ?? null,
      prices: parsedPrices,
      status,
    };
    try {
      if (product) {
        await update(product.id, data);
        toast.success("Product updated");
      } else {
        await add(data);
        toast.success("Product added");
      }
      onClose();
    } catch {
      // error toast already shown by the store
    }
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

        <div className="col-span-2">
          <label className={labelClass}>Description</label>
          <textarea className={`${inputClass} resize-none`} rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Product description" />
        </div>

        <div className="col-span-2">
          <label className={labelClass}>Prices by currency</label>
          <PriceEditor prices={prices} onChange={setPrices} inputClass={inputClass} />
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
