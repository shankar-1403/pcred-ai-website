import { useState } from 'react'
import { ref, update } from 'firebase/database'
import { db } from '../../lib/firebase'
import { previewPath } from '../../lib/bundlePreviews'
import { formatPrice } from '../../lib/cart'
import { saveOrder } from '../../lib/cms'
import Modal from './Modal'
import ProductEditor from './ProductEditor'
import { IconBadge } from './SuitEditor'
import { Button, Notice, inputClass } from './ui'

const ALL = 'all'

function documentsSummary(product) {
  const count = product.documents.length
  if (!count) return product.description || 'No products listed'
  return `${count} product${count === 1 ? '' : 's'} included`
}

// Only rendered when a row exists, so `row` is never null here (the React Compiler would
// otherwise read `row.key` etc. during render even when nothing is being edited).
function EditRow({ row, suits, onDone, onCancel }) {
  return (
    <Modal label={`Edit ${row.product.name}`} onClose={onCancel}>
      <ProductEditor suits={suits} suitSlug={row.suit.slug} product={row.product} onDone={onDone} onCancel={onCancel} />
    </Modal>
  )
}

function ProductsPanel({ suits, loading, initialCategory }) {
  const [category, setCategory] = useState(initialCategory || ALL)
  const [query, setQuery] = useState('')
  const [editing, setEditing] = useState(null) // 'new', '{suitSlug}/{productId}', or null
  const [notice, setNotice] = useState(null)

  // Every product with the category it belongs to
  const rows = suits.flatMap((suit) => suit.products.map((product) => ({ suit, product, key: `${suit.slug}/${product.id}` })))
  const needle = query.trim().toLowerCase()
  const visible = rows.filter(
    ({ suit, product }) =>
      (category === ALL || suit.slug === category) &&
      (!needle || product.name.toLowerCase().includes(needle) || product.description.toLowerCase().includes(needle)),
  )
  const editingRow = rows.find((row) => row.key === editing)

  const onDelete = async ({ suit, product }) => {
    if (!window.confirm(`Delete "${product.name}" from ${suit.name}? This cannot be undone.`)) return
    try {
      await update(ref(db), {
        [`suits/${suit.slug}/products/${product.id}`]: null,
        [previewPath(suit.slug, product.id)]: null,
      })
      await saveOrder(`suits/${suit.slug}/products`, suit.products.filter((item) => item.id !== product.id).map((item) => item.id))
      setNotice({ tone: 'success', text: `Deleted ${product.name}.` })
    } catch (error) {
      setNotice({ tone: 'error', text: `Could not delete: ${error.message}` })
    }
  }

  const done = (text) => () => {
    setEditing(null)
    if (text) setNotice({ tone: 'success', text })
  }
  const cancel = () => setEditing(null)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Bundles</h1>
          <p className="text-xs text-[#00245A]/50">
            {rows.length} {rows.length === 1 ? 'bundle' : 'bundles'} across {suits.length} {suits.length === 1 ? 'category' : 'categories'} · each shows on its category&rsquo;s page
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing('new')
            setNotice(null)
          }}
          disabled={suits.length === 0 || editing === 'new'}
        >
          + New bundle
        </Button>
      </div>

      {suits.length === 0 && !loading ? <Notice>Create a category first, then add bundles to it.</Notice> : null}
      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      {editing === 'new' ? (
        <Modal label="New bundle" onClose={cancel}>
          <ProductEditor
            suits={suits}
            suitSlug={category === ALL ? '' : category}
            onDone={done('Bundle added.')}
            onCancel={cancel}
          />
        </Modal>
      ) : null}
      {editingRow ? <EditRow key={editing} row={editingRow} suits={suits} onDone={done('Bundle saved.')} onCancel={cancel} /> : null}

      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="sm:w-64">
          <span className="sr-only">Filter by category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className={`${inputClass} cursor-pointer`}>
            <option value={ALL}>All categories</option>
            {suits.map((suit) => (
              <option key={suit.slug} value={suit.slug}>
                {suit.name} ({suit.products.length})
              </option>
            ))}
          </select>
        </label>
        <label className="flex-1">
          <span className="sr-only">Search bundles</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or description"
            className={inputClass}
          />
        </label>
      </div>

      <div className="overflow-x-auto rounded-[1.5rem] border border-white bg-white shadow-[0_20px_50px_-36px_rgba(0,36,90,0.5)]">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b border-[#00245A]/8 bg-[#F4F9FF] text-xs font-semibold text-[#00245A]/60">
            <tr>
              <th scope="col" className="px-5 py-3">Bundle</th>
              <th scope="col" className="px-5 py-3">Category</th>
              <th scope="col" className="px-5 py-3 text-right">Price</th>
              <th scope="col" className="px-5 py-3 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#00245A]/6">
            {loading ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-[#00245A]/50" aria-busy="true">
                  Loading bundles…
                </td>
              </tr>
            ) : visible.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-[#00245A]/50">
                  {rows.length === 0 ? 'No bundles yet. Add the first one.' : 'No bundles match this filter.'}
                </td>
              </tr>
            ) : (
              visible.map((row) => (
                <tr key={row.key} className={editing === row.key ? 'bg-[#EAF6FF]/60' : 'hover:bg-[#F4F9FF]/70'}>
                  <td className="max-w-xs px-5 py-3.5">
                    <p className="truncate font-semibold">{row.product.name}</p>
                    <p className="truncate text-xs text-[#00245A]/50">{documentsSummary(row.product)}</p>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-2">
                      <IconBadge iconKey={row.suit.icon} className="h-7 w-7 rounded-lg" />
                      <span className="truncate">{row.suit.name}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-semibold whitespace-nowrap">{formatPrice(row.product.price)}</td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <Button
                      tone="ghost"
                      className="px-3"
                      onClick={() => {
                        setEditing(row.key)
                        setNotice(null)
                      }}
                    >
                      Edit<span className="sr-only"> {row.product.name}</span>
                    </Button>
                    <Button tone="ghost" className="px-3 text-[#C2261C] hover:bg-[#FDECEA] hover:text-[#C2261C]" onClick={() => onDelete(row)}>
                      Delete<span className="sr-only"> {row.product.name}</span>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ProductsPanel
