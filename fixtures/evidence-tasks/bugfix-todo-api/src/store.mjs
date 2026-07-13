// In-memory TODO store. Dates are ISO `YYYY-MM-DD` strings throughout.

export function createStore() {
  const todos = []
  let nextId = 1

  return {
    /** Add a todo. `due` is an ISO date string (YYYY-MM-DD) or null. */
    add({ title, due = null }) {
      if (typeof title !== 'string' || title.trim() === '') {
        throw new Error('title is required')
      }
      if (due !== null && !/^\d{4}-\d{2}-\d{2}$/.test(due)) {
        throw new Error(`invalid due date: ${due}`)
      }
      const todo = { id: nextId, title: title.trim(), due, done: false }
      nextId += 1
      todos.push(todo)
      return todo
    },

    /** Mark a todo done. Returns the todo or null when the id is unknown. */
    complete(id) {
      const todo = todos.find((t) => t.id === id)
      if (!todo) return null
      todo.done = true
      return todo
    },

    /**
     * List todos. `dueBefore` (ISO date) keeps only todos due ON OR BEFORE the
     * given date — a todo due exactly on the boundary date is included.
     * Todos without a due date are always excluded when the filter is set.
     */
    list({ dueBefore = null, includeDone = true } = {}) {
      let out = todos.slice()
      if (!includeDone) out = out.filter((t) => !t.done)
      if (dueBefore !== null) {
        out = out.filter((t) => t.due !== null && t.due < dueBefore)
      }
      return out
    },
  }
}
