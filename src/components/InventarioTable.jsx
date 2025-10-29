import { useState } from 'react';

export default function InventarioTable({ data = [], onRefresh }) {
  const [sortField, setSortField] = useState('CANTIDAD');
  const [sortDirection, setSortDirection] = useState('desc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    const aVal = a[sortField] || '';
    const bVal = b[sortField] || '';
    
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    
    if (sortDirection === 'asc') {
      return aStr.localeCompare(bStr);
    } else {
      return bStr.localeCompare(aStr);
    }
  });

  const getSortIcon = (field) => {
    if (sortField !== field) return '↕️';
    return sortDirection === 'asc' ? '⬆️' : '⬇️';
  };

  const getStockStatus = (cantidad) => {
    if (cantidad >= 100) return { class: 'status-good', text: 'Óptimo' };
    if (cantidad >= 50) return { class: 'status-warning', text: 'Medio' };
    return { class: 'status-danger', text: 'Bajo' };
  };

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>📋 Inventario Global</h2>
        <button onClick={onRefresh} style={{ background: '#10b981' }}>
          🔄 Actualizar
        </button>
      </div>
      
      {!data.length ? (
        <div className="text-center" style={{ padding: '2rem' }}>
          <p style={{ fontSize: '1.5rem', color: 'var(--text-secondary)' }}>📦</p>
          <p>No hay datos de inventario disponibles</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th 
                  onClick={() => handleSort('ID_INVENTARIO')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  ID {getSortIcon('ID_INVENTARIO')}
                </th>
                <th 
                  onClick={() => handleSort('PRODUCTO')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Producto {getSortIcon('PRODUCTO')}
                </th>
                <th 
                  onClick={() => handleSort('INSTALACION')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Instalación {getSortIcon('INSTALACION')}
                </th>
                <th 
                  onClick={() => handleSort('CANTIDAD')}
                  style={{ cursor: 'pointer', userSelect: 'none' }}
                >
                  Cantidad {getSortIcon('CANTIDAD')}
                </th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {sortedData.map((item, index) => {
                const cantidad = item.CANTIDAD || 0;
                const status = getStockStatus(cantidad);
                
                return (
                  <tr key={item.ID_INVENTARIO || index}>
                    <td>
                      <strong>#{item.ID_INVENTARIO}</strong>
                    </td>
                    <td>
                      <div>
                        <strong>{item.PRODUCTO}</strong>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        🏢 {item.INSTALACION}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <strong style={{ 
                          fontSize: '1.1rem',
                          color: cantidad < 50 ? '#ef4444' : cantidad < 100 ? '#f59e0b' : '#10b981'
                        }}>
                          {cantidad.toLocaleString()}
                        </strong>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          unidades
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={`status ${status.class}`}>
                        {status.text}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          <div style={{ 
            marginTop: '1rem', 
            padding: '1rem', 
            background: 'var(--gray-50)', 
            borderRadius: 'var(--border-radius)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}>
            <div>
              <strong>Total items: {data.length}</strong>
            </div>
            <div>
              <strong>Total unidades: {data.reduce((sum, item) => sum + (item.CANTIDAD || 0), 0).toLocaleString()}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
