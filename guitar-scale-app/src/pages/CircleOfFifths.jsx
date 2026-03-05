import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import html2canvas from 'html2canvas'
import './CircleOfFifths.css'

const COLUMNS = [
  'Bemóis / Sustenidos',
  'Tom Maior',
  'Tom Menor',
  'Acorde Diminuto',
]

const ROWS_COUNT = 12

function createEmptyTable() {
  return Array.from({ length: ROWS_COUNT }, () =>
    Array.from({ length: COLUMNS.length }, () => '')
  )
}

function CircleOfFifths() {
  const navigate = useNavigate()
  const [tableData, setTableData] = useState(createEmptyTable)
  const [tableName, setTableName] = useState('')
  const captureRef = useRef(null)

  const handleCellChange = useCallback((rowIndex, colIndex, value) => {
    setTableData(prev => {
      const next = prev.map(row => [...row])
      next[rowIndex][colIndex] = value
      return next
    })
  }, [])

  const handleClearTable = useCallback(() => {
    setTableData(createEmptyTable())
    setTableName('')
  }, [])

  const handleDownload = useCallback(async () => {
    if (!captureRef.current) return
    try {
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: '#121212',
        scale: 2,
        useCORS: true,
      })
      const link = document.createElement('a')
      const fileName = tableName.trim()
        ? `${tableName.trim().replace(/[^a-zA-Z0-9#\s-]/g, '_')}.png`
        : 'ciclo-das-quintas.png'
      link.download = fileName
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (err) {
      console.error('Erro ao gerar imagem:', err)
    }
  }, [tableName])

  const hasData = tableData.some(row => row.some(cell => cell.trim() !== ''))

  return (
    <div className="cof-page">
      <header className="cof-header">
        <button className="back-button" onClick={() => navigate('/')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Voltar
        </button>
        <h1>🎵 Ciclo das Quintas</h1>
        <p className="cof-subtitle">Preencha a tabela com o ciclo das quintas</p>
      </header>

      <div className="cof-controls">
        <button
          className="cof-btn cof-btn-clear"
          onClick={handleClearTable}
          disabled={!hasData && !tableName.trim()}
        >
          🗑️ Limpar
        </button>
        <button
          className="cof-btn cof-btn-download"
          onClick={handleDownload}
          disabled={!hasData}
        >
          📥 Download da Tabela
        </button>
      </div>

      <div className="cof-name-container">
        <input
          type="text"
          className="cof-name-input"
          placeholder="Digite um título para a tabela... Ex: Ciclo das Quintas - Maior"
          value={tableName}
          onChange={(e) => setTableName(e.target.value)}
        />
      </div>

      <div ref={captureRef} className="cof-capture-area">
        {tableName.trim() && (
          <div className="cof-table-title">
            <h2>{tableName}</h2>
          </div>
        )}

        <div className="cof-table-wrapper">
          <table className="cof-table">
            <thead>
              <tr>
                <th className="cof-row-number">#</th>
                {COLUMNS.map((col, i) => (
                  <th key={i}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="cof-row-number">{rowIndex + 1}</td>
                  {row.map((cell, colIndex) => (
                    <td key={colIndex} className="cof-cell">
                      <input
                        type="text"
                        className="cof-cell-input"
                        value={cell}
                        onChange={(e) =>
                          handleCellChange(rowIndex, colIndex, e.target.value)
                        }
                        placeholder="—"
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <footer className="cof-footer">
        <span>Powered by <strong>Marcelo Abrão da Silva</strong></span>
        <a href="https://github.com/masilvasql" target="_blank" rel="noopener noreferrer" className="github-link">
          <svg height="20" width="20" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>
          </svg>
          github.com/masilvasql
        </a>
      </footer>
    </div>
  )
}

export default CircleOfFifths
