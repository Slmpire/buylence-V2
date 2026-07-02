import { useState, useEffect, useCallback } from 'react'
import api from '../lib/axios'

export function useSearch(initialQuery = '') {
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  const [filters, setFilters] = useState({
    category: '',
    hall: '',
    priceMin: '',
    priceMax: '',
    sort: 'Most Relevant',
  })

  const search = useCallback(async (searchQuery, searchFilters, searchPage = 1) => {
    if (!searchQuery?.trim()) {
      setResults([])
      setTotal(0)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const params = {
        search: searchQuery.trim(),
        page: searchPage,
        limit: 20,
        ...(searchFilters.category && { category: searchFilters.category }),
        ...(searchFilters.hall && { hall: searchFilters.hall }),
      }

      const res = await api.get('/products', { params })
      setResults(res.data.products)
      setTotal(res.data.total)
      setPage(res.data.page)
      setPages(res.data.pages)
    } catch (err) {
      setError('Search failed. Please try again.')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Re-run search when query or filters change
  useEffect(() => {
    const timeout = setTimeout(() => {
      search(query, filters, 1)
    }, 300) // debounce

    return () => clearTimeout(timeout)
  }, [query, filters, search])

  function updateFilter(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1)
  }

  function resetFilters() {
    setFilters({ category: '', hall: '', priceMin: '', priceMax: '', sort: 'Most Relevant' })
  }

  function nextPage() {
    if (page < pages) {
      const next = page + 1
      setPage(next)
      search(query, filters, next)
    }
  }

  return {
    query, setQuery,
    results, loading, error,
    total, page, pages,
    filters, updateFilter, resetFilters,
    nextPage,
  }
}