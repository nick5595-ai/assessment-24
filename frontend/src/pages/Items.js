import React, { useEffect, useMemo, useState } from 'react';
import { useData } from '../state/DataContext';
import { Link } from 'react-router-dom';
import { List } from 'react-window';

const currency = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD'
});

function ItemRow({ ariaAttributes, style, item }) {
  if (!item) {
    return <div {...ariaAttributes} style={style} className="rwRow" />;
  }
  return (
    <div {...ariaAttributes} style={style} className="rwRow">
      <Link to={'/items/' + item.id} className="rwLink">
        <div className="rwRowLeft">
          <div className="rwName">{item.name}</div>
          <div className="rwMeta">{item.category}</div>
        </div>
        <div className="rwPrice">{currency.format(item.price)}</div>
      </Link>
    </div>
  );
}

function SkeletonRow({ ariaAttributes, index, style }) {
  const widths = [58, 44, 66, 52, 60];
  const w = widths[index % widths.length];
  return (
    <div {...ariaAttributes} style={style} className="rwRow" aria-hidden="true">
      <div className="rwLink" style={{ pointerEvents: 'none' }}>
        <div className="rwRowLeft">
          <div className="skeleton skeletonLine" style={{ width: `${w}%` }} />
          <div className="skeleton skeletonLineSm" />
        </div>
        <div className="skeleton skeletonPill" />
      </div>
    </div>
  );
}

function Items() {
  const { items, total, fetchItems } = useData();
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const handle = setTimeout(() => {
      setPage(1);
      setQ(qInput.trim());
    }, 250);

    return () => clearTimeout(handle);
  }, [qInput]);

  useEffect(() => {
    const controller = new AbortController();

    setLoading(true);
    setError(null);

    // Cancel in-flight request on unmount (and between page/query changes).
    fetchItems({ q, page, limit, signal: controller.signal })
      .catch(err => {
        if (err?.name === 'AbortError') return;
        console.error(err);
        setError(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [fetchItems, limit, page, q, refreshKey]);

  const totalPages = useMemo(() => {
    const safeLimit = limit > 0 ? limit : 1;
    return Math.max(1, Math.ceil(total / safeLimit));
  }, [limit, total]);

  const canPrev = page > 1;
  const canNext = page < totalPages;
  const showSkeletonList = loading && items.length === 0;
  const showList = showSkeletonList || items.length > 0;
  const shownCount = items.length;

  const VirtualRow = useMemo(() => {
    return function VirtualRowImpl({ ariaAttributes, index, style }) {
      const item = items[index];
      return <ItemRow ariaAttributes={ariaAttributes} style={style} item={item} />;
    };
  }, [items]);

  return (
    <main className="page">
      <div className="pageTitleRow">
        <h1 className="pageTitle">Items</h1>
        <span className="pill" aria-live="polite">
          {loading
            ? 'Loading…'
            : `${total} result${total === 1 ? '' : 's'}${q ? ` for “${q}”` : ''}`}
        </span>
      </div>

      <section className="card">
        <div className="toolbar">
          <div className="field" style={{ minWidth: 320, flex: '1 1 320px' }}>
            <label className="fieldLabel" htmlFor="itemsSearch">
              Search
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                id="itemsSearch"
                type="search"
                value={qInput}
                onChange={e => setQInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    setPage(1);
                    setQ(qInput.trim());
                  }
                }}
                placeholder="Search by name…"
                autoComplete="off"
                spellCheck={false}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                onClick={() => {
                  setPage(1);
                  setQInput('');
                  setQ('');
                }}
                disabled={!qInput}
                aria-label="Clear search"
                title="Clear search"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="field">
            <label className="fieldLabel" htmlFor="pageSize">
              Page size
            </label>
            <select
              id="pageSize"
              value={limit}
              onChange={e => {
                setPage(1);
                setLimit(Number(e.target.value));
              }}
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
            </select>
          </div>

          <div className="toolbarRight" aria-label="Pagination controls">
            <button
              type="button"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={!canPrev}
              aria-label="Previous page"
              title="Previous page"
            >
              Prev
            </button>
            <span className="muted" style={{ fontSize: 13 }}>
              Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            </span>
            <button
              type="button"
              onClick={() => setPage(p => p + 1)}
              disabled={!canNext}
              aria-label="Next page"
              title="Next page"
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <div className="muted" style={{ marginTop: 10 }} aria-live="polite">
        {loading
          ? items.length
            ? `Updating results… (showing ${shownCount} items)`
            : 'Loading results…'
          : items.length
            ? `Showing ${shownCount} of ${total} results`
            : q
              ? `No results for “${q}”.`
              : 'No items found.'}
      </div>

      {error ? (
        <div role="alert" className="alert">
          <div>
            <strong>Couldn’t load items.</strong> {error.message}
          </div>
          <div style={{ marginTop: 10, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" onClick={() => setRefreshKey(k => k + 1)}>
              Retry
            </button>
            <button
              type="button"
              onClick={() => {
                setPage(1);
                setQInput('');
                setQ('');
                setRefreshKey(k => k + 1);
              }}
            >
              Clear search
            </button>
          </div>
        </div>
      ) : null}

      {showList ? (
        <section className="card listCard" aria-busy={loading ? 'true' : 'false'}>
          <List
            className="listRoot"
            defaultHeight={480}
            overscanCount={10}
            rowComponent={showSkeletonList ? SkeletonRow : VirtualRow}
            rowCount={showSkeletonList ? Math.min(limit, 12) : items.length}
            rowHeight={56}
            rowProps={{}}
          />
        </section>
      ) : (
        <section className="card" style={{ marginTop: 12, padding: 16 }}>
          <div className="muted">
            Try adjusting your search or increasing the page size to browse more items.
          </div>
        </section>
      )}
    </main>
  );
}

export default Items;