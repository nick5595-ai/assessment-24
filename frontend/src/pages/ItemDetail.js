import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiUrl } from '../utils/api';

const currency = new Intl.NumberFormat(undefined, {
  style: 'currency',
  currency: 'USD'
});

function ItemDetail() {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setItem(null);

    fetch(apiUrl('/api/items/' + id), { signal: controller.signal })
      .then(async res => {
        if (!res.ok) {
          throw new Error(res.status === 404 ? 'Item not found' : `Request failed (${res.status})`);
        }
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('application/json')) {
          const preview = (await res.text()).slice(0, 120);
          throw new Error(`Expected JSON but got "${contentType}". Response starts with: ${preview}`);
        }
        return res.json();
      })
      .then(json => {
        if (controller.signal.aborted) return;
        setItem(json);
      })
      .catch(err => {
        if (err?.name === 'AbortError') return;
        console.error(err);
        setError(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [id]);

  return (
    <main className="page">
      <div className="pageTitleRow">
        <Link className="backLink" to="/">
          ← Back
        </Link>
        <span className="pill">Item #{id}</span>
      </div>

      <section className="card">
        <div className="detailGrid">
          {error ? (
            <div role="alert" className="alert" style={{ marginTop: 0 }}>
              <strong>Couldn’t load this item.</strong> {error.message}
            </div>
          ) : loading ? (
            <>
              <div className="skeleton" style={{ height: 30, width: '68%', borderRadius: 12 }} />
              <div className="detailMeta">
                <div className="muted">Category</div>
                <div className="skeleton skeletonLine" style={{ width: '40%' }} />
                <div className="muted">Price</div>
                <div className="skeleton skeletonLine" style={{ width: '25%' }} />
              </div>
            </>
          ) : item ? (
            <>
              <h2 className="detailTitle">{item.name}</h2>
              <div className="detailMeta">
                <div className="muted">Category</div>
                <div>{item.category}</div>
                <div className="muted">Price</div>
                <div>{currency.format(item.price)}</div>
              </div>
            </>
          ) : null}
        </div>
      </section>
    </main>
  );
}

export default ItemDetail;