import React from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useParams, useHistory, useRouteMatch, generatePath } from 'react-router-dom'

import { TiPlus } from 'react-icons/ti'
import SearchBar from './SearchBar'
import Note from './Note'

import { openNewNote } from '../../../entities/notes/actions'
import { fetchNoteTags } from '../../../entities/tags/actions'
import { searchIndex } from '../../../services/search'

const searchHandler = searchTerm => {
	return searchIndex.search(searchTerm, {}).sort((a, b) => b.score - a.score)
}

const notesSelector = state => ({
	ids: state.notes.ids,
	idMap: state.notes.idMap,
	notebooks: state.notebooks
})

const notebookSelector = id => state => (!id ? undefined : state.notebooks.idMap[id])
const noteTagSelector = state => {
	return {
		byNote: state.tags.byNote,
		byTag: state.tags.byTag
	}
}

const NotesList = () => {
	const { ids, notebooks } = useSelector(notesSelector)
	const dispatch = useDispatch()
	const params = useParams()
	const history = useHistory()
	const match = useRouteMatch()

	const notebook = useSelector(notebookSelector(params.notebookId))
	const noteTags = useSelector(noteTagSelector)

	const activeNoteId = params.noteId

	const [state, setState] = React.useState({
		searchTerm: '',
		isSearching: false,
		notes: []
	})

	React.useEffect(() => {
		if (ids.length === 0) return

		// not on a notebook so just empty the array
		// when we're not searching and we're not on a notebook, we display all notes from redux
		if (!params.notebookId) {
			if (state.isSearching) {
				const matches = searchHandler(state.searchTerm)
				return setState(prev => ({ ...prev, notes: matches.map(match => match.ref) }))
			}

			return setState(prev => ({ ...prev, notes: [] }))
		}

		const notebook = notebooks.idMap[params.notebookId]

		if (!notebook) return

		let notes = notebook.notes

		// filter notes by search term and active notebook
		if (state.isSearching && notebooks.noteIdMapByBookId[params.notebookId]) {
			const matches = searchHandler(state.searchTerm)

			let bookNotes = []

			matches.forEach(match => {
				if (notebooks.noteIdMapByBookId[params.notebookId][match.ref]) {
					bookNotes.push(match.ref)
				}
			})

			notes = bookNotes
		}

		setState(prev => ({ ...prev, notes }))
	}, [params.notebookId, notebooks, ids, state.searchTerm, state.isSearching])

	const handleNoteSelection = note => {
		// this note is already selected
		if (note.id === params.noteId) return

		dispatch(fetchNoteTags(note.id))

		let pathname = `/note/${note.id}`

		if (match.params.notebookId) {
			pathname = generatePath(match.path, { ...match.params, noteId: note.id })
		}

		history.push({
			pathname,
			state: {
				from: history.location
			}
		})
	}

	const handleTagChange = (tagIds, totalTags) => {
		// TODO: If there are no tags, then undo everything.
		const notebook = notebooks.idMap[params.notebookId]

		if (totalTags === 0) {
			if (state.isSearching) {
				const matches = searchHandler(state.searchTerm)

				const notes = matches.reduce((acc, match) => {
					if (notebook) {
						if (notebooks.noteIdMapByBookId[params.notebookId]?.[match.ref]) {
							acc.push(match.ref)
						}
					} else {
						acc.push(match.ref)
					}

					return acc
				}, [])
				setState(prev => ({ ...prev, notes }))
			} else {
				const notes = ids.reduce((acc, id) => {
					if (notebook) {
						if (notebooks.noteIdMapByBookId[params.notebookId]?.[id]) {
							acc.push(id)
						}
					} else {
						acc.push(id)
					}

					return acc
				}, [])

				setState(prev => ({ ...prev, notes }))
			}

			return
		}

		setState(prev => {
			let notes = []

			if (prev.isSearching) {
				const matches = searchHandler(prev.searchTerm)

				notes = matches.reduce((acc, match) => {
					const notesTags = noteTags.byNote[match.ref]

					const isTagged = notesTags?.length > 0
					// Note isn't tagged but we're dealing with tags, so...
					if (!isTagged) return acc

					if (notebook) {
						if (notebooks.noteIdMapByBookId[params.notebookId]?.[match.ref]) {
							// Only show the note if the note has the selected tags and the note exists within teh selected notebook
							const isInTag = notesTags && notesTags.some(tagId => !!tagIds[tagId])

							if (isInTag) {
								acc.push(match.ref)
							}
						}
					} else {
						const isInTag = notesTags && notesTags.some(tagId => !!tagIds[tagId])

						if (isInTag) {
							acc.push(match.ref)
						}
					}

					return acc
				}, [])
			} else {
				Object.keys(tagIds).forEach(tagId => {
					const noteIds = noteTags.byTag[tagId]
					notes = notes.concat(noteIds || [])
				})
			}

			return {
				...prev,
				notes
			}
		})
	}

	const handleSearch = async value => {
		const isSearching = value.trim().length > 0

		setState(prev => ({ ...prev, searchTerm: value, isSearching }))

		if (!isSearching) return

		const matches = searchHandler(value)

		const notebook = notebooks.idMap[params.notebookId]

		const notes = matches.reduce((acc, match) => {
			if (notebook) {
				if (notebooks.noteIdMapByBookId[params.notebookId]?.[match.ref]) {
					acc.push(match.ref)
				}
			} else {
				acc.push(match.ref)
			}

			return acc
		}, [])

		setState(prev => ({ ...prev, notes }))
	}

	const handleNewNote = () => {
		const notebookId = params.notebookId

		const note = dispatch(openNewNote({ notebookId }))

		const pathname = notebookId ? `/notebook/${notebookId}/${note.id}` : `/note/${note.id}`

		history.push({
			pathname,
			from: history.location
		})
	}

	const noteIds = state.isSearching || params.notebookId ? state.notes : ids
	const canDelete = (!state.isSearching && noteIds.length > 1) || !!params.notebookId

	return (
		<div>
			<div className="mb-2 px-2 w-full pb-2 pt-1 flex">
				<div style={{ width: 'calc(100% - 40px)' }}>
					<SearchBar
						value={state.searchTerm}
						onSearch={handleSearch}
						onTagChange={handleTagChange}
					/>
				</div>
				<div>
					<div
						onClick={handleNewNote}
						className="flex items-center ml-2 rounded bg-gray-300 py-2 px-2 text-gray-600 font-bold cursor-pointer hover:text-gray-700"
					>
						<TiPlus />
					</div>
				</div>
			</div>

			{state.isSearching && (
				<p className="px-8 mb-2 font-semibold text-gray-700">
					Search Results ({state.notes.length})
				</p>
			)}
			{!state.isSearching && (
				<p className="px-4 mb-2 font-semibold text-gray-700">
					{notebook ? notebook.name : 'All Notes'}
				</p>
			)}

			{noteIds.map(id => {
				return (
					<Note
						canDelete={canDelete}
						key={id}
						id={id}
						isSelected={activeNoteId === id}
						onSelect={handleNoteSelection}
					/>
				)
			})}

			{notebook && noteIds.length === 0 && (
				<p className="m-4 text-center text-sm text-gray-400">This notebook is empty</p>
			)}

			<p className="m-4 text-center text-sm text-gray-400">
				<span className="font-bold">control + n</span> for a new note
			</p>
		</div>
	)
}

export default NotesList
