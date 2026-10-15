import { useState } from 'react'
import { Link } from 'react-router'
import { ref, update } from 'firebase/database'
import { db } from '../../lib/firebase'
import { previewPath } from '../../lib/bundlePreviews'
import { saveOrder, swap } from '../../lib/cms'
import Modal from './Modal'
import SuitEditor, { IconBadge } from './SuitEditor'
import { Button, MoveButtons, Notice } from './ui'

// Only rendered when a category exists, so `suit` is never null here (see the React
// Compiler note in SuitEditor.jsx).
function EditCategory({ suit, suits, onSaved, onCancel }) {
  return (
    <Modal label={`Edit ${suit.name}`} onClose={onCancel}>
      <SuitEditor suit={suit} suits={suits} onSaved={onSaved} onCancel={onCancel} />
    </Modal>
  )
}

function CategoriesPanel({ suits, loading, error }) {
  const [editing, setEditing] = useState(null) // 'new', a slug, or null
  const [notice, setNotice] = useState(null)

  const editingSuit = suits.find((suit) => suit.slug === editing)
  const productCount = suits.reduce((total, suit) => total + suit.products.length, 0)

  const open = (target) => {
    setEditing(target)
    setNotice(null)
  }
  const close = () => setEditing(null)
  const saved = (text) => {
    setEditing(null)
    setNotice({ tone: 'success', text })
  }

  const move = (index, offset) =>
    saveOrder('suits', swap(suits, index, offset).map((suit) => suit.slug)).catch((moveError) =>
      setNotice({ tone: 'error', text: `Could not reorder: ${moveError.message}` }),
    )

  const onDelete = async (suit) => {
    const count = suit.products.length
    const message = `Delete "${suit.name}"${count ? ` and its ${count} bundle${count === 1 ? '' : 's'}` : ''}? This cannot be undone.`
    if (!window.confirm(message)) return
    try {
      // The category and its bundles' preview images go in one write
      await update(ref(db), {
        [`suits/${suit.slug}`]: null,
        ...Object.fromEntries(suit.products.map((product) => [previewPath(suit.slug, product.id), null])),
      })
      await saveOrder('suits', suits.filter((item) => item.slug !== suit.slug).map((item) => item.slug))
      if (editing === suit.slug) setEditing(null)
      setNotice({ tone: 'success', text: `Deleted ${suit.name}.` })
    } catch (deleteError) {
      setNotice({ tone: 'error', text: `Could not delete: ${deleteError.message}` })
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Categories</h1>
          <p className="text-xs text-[#00245A]/50">
            {suits.length} {suits.length === 1 ? 'category' : 'categories'} · {productCount} bundles · shown on the site in this order
          </p>
        </div>
        <Button onClick={() => open('new')} disabled={editing === 'new'}>
          + New category
        </Button>
      </div>

      {error ? <Notice tone="error">Could not read the database: {error.message}</Notice> : null}
      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      {editing === 'new' ? (
        <Modal label="New category" onClose={close}>
          <SuitEditor suit={null} suits={suits} onSaved={saved} onCancel={close} />
        </Modal>
      ) : null}
      {editingSuit ? <EditCategory key={editing} suit={editingSuit} suits={suits} onSaved={saved} onCancel={close} /> : null}

      <div className="overflow-x-auto rounded-[1.5rem] border border-white bg-white shadow-[0_20px_50px_-36px_rgba(0,36,90,0.5)]">
        <table className="w-full min-w-[46rem] text-left text-sm">
          <thead className="border-b border-[#00245A]/8 bg-[#F4F9FF] text-xs font-semibold text-[#00245A]/60">
            <tr>
              <th scope="col" className="w-20 px-5 py-3">Order</th>
              <th scope="col" className="px-5 py-3">Category</th>
              <th scope="col" className="px-5 py-3">Summary</th>
              <th scope="col" className="px-5 py-3 text-center">Bundles</th>
              <th scope="col" className="px-5 py-3 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#00245A]/6">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-[#00245A]/50" aria-busy="true">
                  Loading categories…
                </td>
              </tr>
            ) : suits.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-[#00245A]/60">
                  No categories yet. Use <strong>+ New category</strong> to add the first one.
                </td>
              </tr>
            ) : (
              suits.map((suit, index) => (
                <tr key={suit.slug} className={editing === suit.slug ? 'bg-[#EAF6FF]/60' : 'hover:bg-[#F4F9FF]/70'}>
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-2">
                      <MoveButtons
                        label={suit.name}
                        onUp={() => move(index, -1)}
                        onDown={() => move(index, 1)}
                        disabledUp={index === 0}
                        disabledDown={index === suits.length - 1}
                      />
                      <span className="font-mono text-xs text-[#00245A]/50">{String(index + 1).padStart(2, '0')}</span>
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="flex items-center gap-3">
                      <IconBadge iconKey={suit.icon} className="h-9 w-9 rounded-xl" />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold">{suit.name}</span>
                        <a
                          href={`/suits/${suit.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block truncate font-mono text-xs text-[#003BD9]/70 hover:text-[#003BD9] hover:underline"
                        >
                          /suits/{suit.slug}
                        </a>
                      </span>
                    </span>
                  </td>
                  <td className="max-w-xs px-5 py-3.5">
                    <p className="line-clamp-2 text-xs text-[#00245A]/60">{suit.summary || '—'}</p>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <Link
                      to={`/admin/bundles?category=${suit.slug}`}
                      className="inline-flex min-w-8 justify-center rounded-full bg-[#EAF6FF] px-2.5 py-1 font-mono text-xs font-semibold text-[#003BD9] hover:bg-[#D9EEFF]"
                    >
                      {suit.products.length}
                      <span className="sr-only"> bundles in {suit.name}</span>
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <Button tone="ghost" className="px-3" onClick={() => open(suit.slug)}>
                      Edit<span className="sr-only"> {suit.name}</span>
                    </Button>
                    <Link
                      to={`/admin/bundles?category=${suit.slug}`}
                      className="inline-flex items-center rounded-full px-3 py-2 text-sm font-semibold text-[#00245A]/70 transition hover:bg-[#EAF6FF] hover:text-[#00245A]"
                    >
                      Bundles<span className="sr-only"> in {suit.name}</span>
                    </Link>
                    <Button tone="ghost" className="px-3 text-[#C2261C] hover:bg-[#FDECEA] hover:text-[#C2261C]" onClick={() => onDelete(suit)}>
                      Delete<span className="sr-only"> {suit.name}</span>
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

export default CategoriesPanel
