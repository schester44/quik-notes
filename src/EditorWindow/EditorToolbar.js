import React from 'react'
import { FiBold, FiItalic, FiUnderline, FiCode, FiList, FiTrash } from 'react-icons/fi'
import { MdFormatListNumbered } from 'react-icons/md'
import { FaHeading, FaQuoteRight } from 'react-icons/fa'

import MarkButton from './MarkButton'
import BlockButton from './BlockButton'

const EditorToolbar = ({ activeNote, onDelete }) => {
	return (
		<div className="px-2 pb-2 mb-2 flex justify-between border-b border-gray-100">
			<div className="flex">
				<MarkButton format="bold" icon={<FiBold />} />
				<MarkButton format="italic" icon={<FiItalic />} />
				<MarkButton format="underline" icon={<FiUnderline />} />
				<MarkButton format="code" icon={<FiCode />} />
				<BlockButton format="heading-one" icon={<FaHeading />} />
				<BlockButton format="heading-two" icon={<FaHeading />} />
				<BlockButton format="block-quote" icon={<FaQuoteRight />} />
				<BlockButton format="numbered-list" icon={<MdFormatListNumbered />} />
				<BlockButton format="bulleted-list" icon={<FiList />} />
			</div>

			<div className="settings">
				{activeNote.id && (
					<div className="toolbar-btn" onClick={onDelete}>
						<FiTrash />
					</div>
				)}
			</div>
		</div>
	)
}

export default EditorToolbar
