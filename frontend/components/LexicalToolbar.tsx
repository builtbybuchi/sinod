import React, { useCallback, useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  FORMAT_ELEMENT_COMMAND,
  UNDO_COMMAND,
  REDO_COMMAND,
  $createParagraphNode,
  $getRoot,
} from 'lexical';
import {
  $isLinkNode,
  TOGGLE_LINK_COMMAND,
} from '@lexical/link';
import {
  $isListNode,
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListNode,
  REMOVE_LIST_COMMAND,
} from '@lexical/list';
import {
  $isHeadingNode,
  $createHeadingNode,
  $createQuoteNode,
  HeadingTagType,
} from '@lexical/rich-text';
import { $isCodeNode, $createCodeNode, CODE_LANGUAGE_FRIENDLY_NAME_MAP } from '@lexical/code';
import { $getNearestNodeOfType, mergeRegister } from '@lexical/utils';
import { $setBlocksType } from '@lexical/selection';

const FONT_FAMILY_OPTIONS = [
  ['Arial', 'Arial'],
  ['Courier New', 'Courier New, monospace'],
  ['Georgia', 'Georgia, serif'],
  ['Times New Roman', 'Times New Roman, serif'],
  ['Trebuchet MS', 'Trebuchet MS, sans-serif'],
  ['Verdana', 'Verdana, sans-serif'],
];

const FONT_SIZE_OPTIONS = [
  ['10px', '10px'],
  ['12px', '12px'],
  ['14px', '14px'],
  ['16px', '16px'],
  ['18px', '18px'],
  ['20px', '20px'],
  ['24px', '24px'],
  ['28px', '28px'],
  ['32px', '32px'],
  ['40px', '40px'],
];

const ELEMENT_FORMAT_OPTIONS = {
  left: 'left',
  center: 'center',
  right: 'right',
  justify: 'justify',
} as const;

type BlockType = 'paragraph' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'quote' | 'code' | 'bullet' | 'number';

const blockTypeToBlockName: Record<BlockType, string> = {
  paragraph: 'Normal',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  h5: 'Heading 5',
  h6: 'Heading 6',
  quote: 'Quote',
  code: 'Code Block',
  bullet: 'Bulleted List',
  number: 'Numbered List',
};

const LexicalToolbar: React.FC = () => {
  const [editor] = useLexicalComposerContext();
  const [blockType, setBlockType] = useState<BlockType>('paragraph');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] = useState(false);
  const [isCode, setIsCode] = useState(false);
  const [isLink, setIsLink] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [showBlockOptions, setShowBlockOptions] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    
    if ($isRangeSelection(selection)) {
      const anchorNode = selection.anchor.getNode();
      const element =
        anchorNode.getKey() === 'root'
          ? anchorNode
          : anchorNode.getTopLevelElementOrThrow();
      const elementKey = element.getKey();
      const elementDOM = editor.getElementByKey(elementKey);

      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(selection.hasFormat('strikethrough'));
      setIsCode(selection.hasFormat('code'));

      // Update block type
      if (elementDOM !== null) {
        if ($isListNode(element)) {
          const parentList = $getNearestNodeOfType(anchorNode, ListNode);
          const type = parentList ? parentList.getListType() : element.getListType();
          setBlockType(type === 'number' ? 'number' : 'bullet');
        } else {
          const type = $isHeadingNode(element)
            ? element.getTag()
            : element.getType();
          
          if (type === 'code') {
            setBlockType('code');
          } else if (type === 'quote') {
            setBlockType('quote');
          } else if (type in blockTypeToBlockName) {
            setBlockType(type as BlockType);
          } else {
            setBlockType('paragraph');
          }
        }
      }

      // Update link
      const node = selection.anchor.getNode();
      const parent = node.getParent();
      if ($isLinkNode(parent) || $isLinkNode(node)) {
        setIsLink(true);
      } else {
        setIsLink(false);
      }
    }
  }, [editor]);

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(({ editorState }) => {
        editorState.read(() => {
          updateToolbar();
        });
      }),
      editor.registerCommand(
        UNDO_COMMAND,
        () => {
          setCanUndo(editor.getEditorState().read(() => true));
          return false;
        },
        1
      ),
      editor.registerCommand(
        REDO_COMMAND,
        () => {
          setCanRedo(editor.getEditorState().read(() => true));
          return false;
        },
        1
      )
    );
  }, [editor, updateToolbar]);

  const formatBlock = (type: BlockType) => {
    if (type === 'bullet' || type === 'number') {
      if (blockType !== type) {
        editor.dispatchCommand(
          type === 'number' ? INSERT_ORDERED_LIST_COMMAND : INSERT_UNORDERED_LIST_COMMAND,
          undefined
        );
      } else {
        editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
      }
    } else {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          if (type === 'paragraph') {
            $setBlocksType(selection, () => $createParagraphNode());
          } else if (type === 'code') {
            $setBlocksType(selection, () => $createCodeNode());
          } else if (type === 'quote') {
            $setBlocksType(selection, () => $createQuoteNode());
          } else if (type.startsWith('h')) {
            $setBlocksType(selection, () => $createHeadingNode(type as HeadingTagType));
          }
        }
      });
    }
    setShowBlockOptions(false);
  };

  const insertLink = useCallback(() => {
    if (!isLink && linkUrl) {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, linkUrl);
      setShowLinkInput(false);
      setLinkUrl('');
    } else {
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
      setIsLink(false);
    }
  }, [editor, isLink, linkUrl]);

  const ToolbarButton: React.FC<{
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    title: string;
    children: React.ReactNode;
  }> = ({ onClick, active, disabled, title, children }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`p-2 rounded transition-colors ${
        active
          ? 'bg-sky-500 text-white'
          : 'text-white/70 hover:bg-white/10 hover:text-white'
      } ${disabled ? 'opacity-40 cursor-not-allowed' : ''}`}
    >
      {children}
    </button>
  );

  return (
    <div className="flex items-center gap-1 border-b border-white/10 bg-slate-900/80 px-4 py-2 flex-wrap">
      {/* Undo/Redo */}
      <div className="flex gap-1 border-r border-white/10 pr-2">
        <ToolbarButton
          onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
          disabled={!canUndo}
          title="Undo (Ctrl+Z)"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
          disabled={!canRedo}
          title="Redo (Ctrl+Y)"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
          </svg>
        </ToolbarButton>
      </div>

      {/* Block Type */}
      <div className="relative border-r border-white/10 pr-2">
        <button
          onClick={() => setShowBlockOptions(!showBlockOptions)}
          className="flex items-center gap-2 rounded px-3 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white"
        >
          <span>{blockTypeToBlockName[blockType]}</span>
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showBlockOptions && (
          <div className="absolute top-full left-0 mt-1 z-10 w-48 rounded-lg border border-white/15 bg-slate-900 shadow-xl">
            {Object.entries(blockTypeToBlockName).map(([type, name]) => (
              <button
                key={type}
                onClick={() => formatBlock(type as BlockType)}
                className="w-full px-4 py-2 text-left text-sm text-white/70 hover:bg-white/10 hover:text-white first:rounded-t-lg last:rounded-b-lg"
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Text Formatting */}
      <div className="flex gap-1 border-r border-white/10 pr-2">
        <ToolbarButton
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')}
          active={isBold}
          title="Bold (Ctrl+B)"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15.6 10.79c.97-.67 1.65-1.77 1.65-2.79 0-2.26-1.75-4-4-4H7v14h7.04c2.09 0 3.71-1.7 3.71-3.79 0-1.52-.86-2.82-2.15-3.42zM10 6.5h3c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5h-3v-3zm3.5 9H10v-3h3.5c.83 0 1.5.67 1.5 1.5s-.67 1.5-1.5 1.5z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'italic')}
          active={isItalic}
          title="Italic (Ctrl+I)"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 4v3h2.21l-3.42 8H6v3h8v-3h-2.21l3.42-8H18V4z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'underline')}
          active={isUnderline}
          title="Underline (Ctrl+U)"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 17c3.31 0 6-2.69 6-6V3h-2.5v8c0 1.93-1.57 3.5-3.5 3.5S8.5 12.93 8.5 11V3H6v8c0 3.31 2.69 6 6 6zm-7 2v2h14v-2H5z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')}
          active={isStrikethrough}
          title="Strikethrough"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M10 19h4v-3h-4v3zM5 4v3h5v3h4V7h5V4H5zM3 14h18v-2H3v2z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'code')}
          active={isCode}
          title="Code"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </ToolbarButton>
      </div>

      {/* Link */}
      <div className="relative border-r border-white/10 pr-2">
        <ToolbarButton
          onClick={() => {
            if (isLink) {
              editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
            } else {
              setShowLinkInput(!showLinkInput);
            }
          }}
          active={isLink}
          title="Insert Link"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </ToolbarButton>
        {showLinkInput && (
          <div className="absolute top-full left-0 mt-1 z-10 flex gap-2 rounded-lg border border-white/15 bg-slate-900 p-2 shadow-xl">
            <input
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className="rounded border border-white/15 bg-white/5 px-3 py-1 text-sm text-white outline-none focus:border-sky-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  insertLink();
                }
              }}
            />
            <button
              onClick={insertLink}
              className="rounded bg-sky-500 px-3 py-1 text-sm text-white hover:bg-sky-600"
            >
              Add
            </button>
          </div>
        )}
      </div>

      {/* Alignment */}
      <div className="flex gap-1 border-r border-white/10 pr-2">
        <ToolbarButton
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'left')}
          title="Align Left"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M15 15H3v2h12v-2zm0-8H3v2h12V7zM3 13h18v-2H3v2zm0 8h18v-2H3v2zM3 3v2h18V3H3z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'center')}
          title="Align Center"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M7 15v2h10v-2H7zm-4 6h18v-2H3v2zm0-8h18v-2H3v2zm4-6v2h10V7H7zM3 3v2h18V3H3z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'right')}
          title="Align Right"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 21h18v-2H3v2zm6-4h12v-2H9v2zm-6-4h18v-2H3v2zm6-4h12V7H9v2zM3 3v2h18V3H3z" />
          </svg>
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, 'justify')}
          title="Justify"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 21h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18v-2H3v2zm0-4h18V7H3v2zm0-6v2h18V3H3z" />
          </svg>
        </ToolbarButton>
      </div>
    </div>
  );
};

export default LexicalToolbar;
