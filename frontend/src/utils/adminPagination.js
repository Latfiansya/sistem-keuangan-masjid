export function paginateAdminTransactions(transactions, requestedPage = 1, size = 20) {
  const pageSize = [20, 30, 50, 'all'].includes(size) ? size : 20
  const total = transactions.length
  const pageCount = pageSize === 'all' ? 1 : Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, Number.isInteger(requestedPage) ? requestedPage : 1), pageCount)
  const offset = pageSize === 'all' ? 0 : (page - 1) * pageSize
  let pages = []
  if (pageSize !== 'all' && total > 0) {
    if (pageCount <= 7) pages = Array.from({ length: pageCount }, (_, index) => index + 1)
    else {
      const visible = new Set([1, pageCount, ...(page <= 2 ? [1, 2, 3] : page >= pageCount - 1 ? [pageCount - 2, pageCount - 1, pageCount] : [page - 1, page, page + 1])])
      for (const number of [...visible].sort((a, b) => a - b)) {
        const previous = pages.at(-1)
        if (previous && number - previous > 1) pages.push('…')
        pages.push(number)
      }
    }
  }
  const rows = pageSize === 'all' ? transactions : transactions.slice(offset, offset + pageSize)
  return { rows, total, page, pageCount, pageSize, pages, start: total ? offset + 1 : 0, end: offset + rows.length }
}
