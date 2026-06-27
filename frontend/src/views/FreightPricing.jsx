import React, { useState } from 'react';
import { Calculator, Route, Coins, Plus, Trash2 } from 'lucide-react';

export default function FreightPricing() {
  const [pricingFactors, setPricingFactors] = useState({
    weight: 1500, // kg
    distance: 450, // km
    vehicleFactor: 1.2, // Prima model factor
    categoryFactor: 1.1, // Pharma/Cold chain category factor
    fuelSurcharge: 120.00, // flat rate Surcharge
    gstRate: 0.18 // GST 18%
  });

  const [routeCards, setRouteCards] = useState([
    { id: 1, origin: 'Seattle, WA', destination: 'Portland, OR', baseRate: 1500.00, distance: 174 },
    { id: 2, origin: 'Detroit, MI', destination: 'Chicago, IL', baseRate: 2500.00, distance: 282 },
    { id: 3, origin: 'Boston, MA', destination: 'New York, NY', baseRate: 1800.00, distance: 215 }
  ]);

  // Calculate pricing
  const baseFreight = pricingFactors.distance * 2.5 * pricingFactors.vehicleFactor * pricingFactors.categoryFactor;
  const cargoWeightCharge = (pricingFactors.weight / 100) * 1.5;
  const subtotal = baseFreight + cargoWeightCharge + pricingFactors.fuelSurcharge;
  const gstAmount = subtotal * pricingFactors.gstRate;
  const grandTotal = subtotal + gstAmount;

  return (
    <div className="view-container">
      <div className="view-header">
        <div>
          <h1 className="view-header-title">Freight Cost & Route Pricing</h1>
          <p className="view-header-subtitle">Perform instant logistics freight estimations and configure route tariff matrices.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Cost Estimator Calculator */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calculator style={{ color: 'var(--primary)' }} />
            <span>Instant Price Estimator</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="form-label">Cargo Weight (kg)</label>
                <input
                  type="number"
                  className="form-input"
                  value={pricingFactors.weight}
                  onChange={e => setPricingFactors({ ...pricingFactors, weight: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="form-label">Transit Distance (km)</label>
                <input
                  type="number"
                  className="form-input"
                  value={pricingFactors.distance}
                  onChange={e => setPricingFactors({ ...pricingFactors, distance: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label className="form-label">Vehicle Coeff Factor</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={pricingFactors.vehicleFactor}
                  onChange={e => setPricingFactors({ ...pricingFactors, vehicleFactor: parseFloat(e.target.value) || 1.0 })}
                />
              </div>
              <div>
                <label className="form-label">Category Multiplier</label>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  value={pricingFactors.categoryFactor}
                  onChange={e => setFormData({ ...pricingFactors, categoryFactor: parseFloat(e.target.value) || 1.0 })}
                  value={pricingFactors.categoryFactor}
                  onChange={e => setPricingFactors({ ...pricingFactors, categoryFactor: parseFloat(e.target.value) || 1.0 })}
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Cost Breakdown</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', fontSize: '0.85rem' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Base Distance Freight:</span>
                  <span>₹{baseFreight.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Weight Surcharge:</span>
                  <span>₹{cargoWeightCharge.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Fuel Surcharge:</span>
                  <span>₹{pricingFactors.fuelSurcharge.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.25rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>GST (18%):</span>
                  <span>₹{gstAmount.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.05rem', paddingTop: '0.25rem', color: 'var(--primary)' }}>
                  <span>Estimated Total:</span>
                  <span>₹{grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Route Tariff Cards */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1.1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Route style={{ color: 'var(--primary)' }} />
            <span>Route Rate Cards</span>
          </h3>

          <div style={{ overflowX: 'auto' }}>
            <table className="delivery-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Origin</th>
                  <th>Destination</th>
                  <th>Distance</th>
                  <th>Base Rate</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {routeCards.map(r => (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{r.origin}</td>
                    <td style={{ fontWeight: 600 }}>{r.destination}</td>
                    <td>{r.distance} km</td>
                    <td style={{ fontWeight: 700, color: 'var(--primary)' }}>₹{r.baseRate.toFixed(2)}</td>
                    <td>
                      <button className="btn btn-outline" onClick={() => setRouteCards(routeCards.filter(x => x.id !== r.id))} style={{ color: 'var(--danger)', padding: '0.35rem', minWidth: 'auto' }}>
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
