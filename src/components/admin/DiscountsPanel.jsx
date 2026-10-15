import { useState } from 'react'
import { ref, remove, update } from 'firebase/database'
import { db } from '../../lib/firebase'
import { formatPrice } from '../../lib/cart'
import DiscountEditor from './DiscountEditor'
import Modal from './Modal'
import { Button, Notice } from './ui'

// Only rendered when a tier exists (see the React Compiler note in SuitEditor.jsx)
function EditTier({ tier, tiers, onDone, onCancel }) {
  return (
    <Modal label="Edit discount tier" onClose={onCancel}>
      <DiscountEditor tier={tier} tiers={tiers} onDone={onDone} onCancel={onCancel} />
    </Modal>
  )
}

function DiscountsPanel({ tiers, loading }) {
  const [editing, setEditing] = useState(null) // 'new', a tier id, or null
  const [notice, setNotice] = useState(null)
  const editingTier = tiers.find((tier) => tier.id === editing)
  const activeCount = tiers.filter((tier) => tier.active).length

  const done = (text) => () => {
    setEditing(null)
    setNotice({ tone: 'success', text })
  }
  const cancel = () => setEditing(null)

  const toggle = (tier) =>
    update(ref(db, `discounts/${tier.id}`), { active: !tier.active }).catch((error) =>
      setNotice({ tone: 'error', text: `Could not update: ${error.message}` }),
    )

  const onDelete = async (tier) => {
    if (!window.confirm(`Delete the ${tier.percent}% tier for orders of ${formatPrice(tier.minAmount)} or more?`)) return
    try {
      await remove(ref(db, `discounts/${tier.id}`))
      setNotice({ tone: 'success', text: 'Discount tier deleted.' })
    } catch (error) {
      setNotice({ tone: 'error', text: `Could not delete: ${error.message}` })
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Discounts</h1>
          <p className="text-xs text-[#00245A]/50">
            {tiers.length} {tiers.length === 1 ? 'tier' : 'tiers'} · {activeCount} active · applied to the cart total at checkout
          </p>
        </div>
        <Button
          onClick={() => {
            setEditing('new')
            setNotice(null)
          }}
        >
          + New tier
        </Button>
      </div>

      <p className="rounded-2xl border border-[#00B2FC]/25 bg-white/70 px-4 py-3 text-sm text-[#00245A]/70">
        Each tier gives a percentage off when the cart total reaches its minimum amount. If a cart qualifies for several tiers, the
        biggest discount applies. Customers also see how much more they need to add to reach the next tier.
      </p>

      {notice ? <Notice tone={notice.tone}>{notice.text}</Notice> : null}

      {editing === 'new' ? (
        <Modal label="New discount tier" onClose={cancel}>
          <DiscountEditor tier={null} tiers={tiers} onDone={done('Discount tier added.')} onCancel={cancel} />
        </Modal>
      ) : null}
      {editingTier ? <EditTier key={editing} tier={editingTier} tiers={tiers} onDone={done('Discount tier saved.')} onCancel={cancel} /> : null}

      <div className="overflow-x-auto rounded-[1.5rem] border border-white bg-white shadow-[0_20px_50px_-36px_rgba(0,36,90,0.5)]">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead className="border-b border-[#00245A]/8 bg-[#F4F9FF] text-xs font-semibold text-[#00245A]/60">
            <tr>
              <th scope="col" className="px-5 py-3">Minimum order</th>
              <th scope="col" className="px-5 py-3">Discount</th>
              <th scope="col" className="px-5 py-3">At the minimum, customer pays</th>
              <th scope="col" className="px-5 py-3">Status</th>
              <th scope="col" className="px-5 py-3 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#00245A]/6">
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-[#00245A]/50" aria-busy="true">
                  Loading discounts…
                </td>
              </tr>
            ) : tiers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-10 text-center text-[#00245A]/50">
                  No discount tiers yet. Add one, for example 10% off orders of ₹5,000 or more.
                </td>
              </tr>
            ) : (
              tiers.map((tier) => (
                <tr key={tier.id} className={tier.active ? 'hover:bg-[#F4F9FF]/70' : 'bg-[#F4F9FF]/40 text-[#00245A]/50'}>
                  <td className="px-5 py-3.5 font-semibold">{formatPrice(tier.minAmount)}+</td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex rounded-full bg-[#E6FAF0] px-2.5 py-1 font-mono text-xs font-semibold text-[#128C4A]">
                      {tier.percent}% off
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[#00245A]/70">
                    {formatPrice(tier.minAmount - Math.round((tier.minAmount * tier.percent) / 100))}
                    <span className="ml-1 text-xs text-[#00245A]/45">instead of {formatPrice(tier.minAmount)}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={tier.active}
                      onClick={() => toggle(tier)}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-full text-xs font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00B2FC]"
                    >
                      <span
                        aria-hidden="true"
                        className={`relative h-5 w-9 rounded-full transition ${tier.active ? 'bg-[#00B2FC]' : 'bg-[#00245A]/20'}`}
                      >
                        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${tier.active ? 'left-4.5' : 'left-0.5'}`} />
                      </span>
                      {tier.active ? 'Active' : 'Paused'}
                      <span className="sr-only">, {tier.percent}% tier</span>
                    </button>
                  </td>
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <Button tone="ghost" className="px-3" onClick={() => setEditing(tier.id)}>
                      Edit<span className="sr-only"> {tier.percent}% tier</span>
                    </Button>
                    <Button tone="ghost" className="px-3 text-[#C2261C] hover:bg-[#FDECEA] hover:text-[#C2261C]" onClick={() => onDelete(tier)}>
                      Delete<span className="sr-only"> {tier.percent}% tier</span>
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

export default DiscountsPanel
