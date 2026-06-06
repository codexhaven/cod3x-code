import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * ═══════════════════════════════════════════════════════════════
 * Enhanced Chat Interface - Cod3x Code v4.0
 * Developed by CodexHaven
 * ═══════════════════════════════════════════════════════════════
 */
import React, { useState, useCallback } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
export const ChatInterface = ({ messages, onSendMessage, onSlashCommand, isThinking, isStreaming, config, trail, }) => {
    const [input, setInput] = useState('');
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const handleSubmit = useCallback(async (value) => {
        if (!value.trim())
            return;
        setInput('');
        setHistory((prev) => [...prev, value]);
        setHistoryIndex(-1);
        if (value.startsWith('/')) {
            const parts = value.slice(1).split(' ');
            await onSlashCommand(parts[0], parts.slice(1));
        }
        else {
            await onSendMessage(value);
        }
    }, [onSendMessage, onSlashCommand]);
    useInput((_, key) => {
        if (key.upArrow && history.length > 0) {
            const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
            setHistoryIndex(newIndex);
            setInput(history[newIndex]);
        }
        if (key.downArrow && historyIndex !== -1) {
            const newIndex = historyIndex + 1;
            if (newIndex >= history.length) {
                setHistoryIndex(-1);
                setInput('');
            }
            else {
                setHistoryIndex(newIndex);
                setInput(history[newIndex]);
            }
        }
    });
    return (_jsxs(Box, { flexDirection: "column", flexGrow: 1, children: [_jsxs(Box, { flexDirection: "column", flexGrow: 1, children: [messages.map((msg, idx) => (_jsx(MessageBubble, { message: msg, config: config }, idx))), isThinking && (_jsx(Box, { paddingX: 2, paddingY: 1, children: _jsxs(Text, { color: "yellow", children: [_jsx(Spinner, {}), " Thinking..."] }) })), isStreaming && (_jsx(Box, { paddingX: 2, paddingY: 1, children: _jsx(Text, { color: "cyan", children: "Streaming..." }) })), trail && trail.steps.length > 0 && (_jsxs(Box, { flexDirection: "column", borderStyle: "single", borderColor: "gray", paddingX: 1, marginY: 1, children: [_jsxs(Text, { bold: true, color: "magenta", children: ["Debug Trail (", trail.status, ")"] }), trail.steps.slice(-5).map((step, i) => (_jsxs(Text, { color: step.success ? 'green' : 'red', dimColor: i < trail.steps.length - 3, children: [step.type, ": ", step.description.slice(0, 60)] }, i)))] }))] }), _jsxs(Box, { borderStyle: "single", borderColor: "cyan", paddingX: 1, children: [_jsxs(Text, { color: "cyan", children: [isThinking ? '...' : '>', " "] }), _jsx(TextInput, { value: input, onChange: setInput, onSubmit: handleSubmit, placeholder: "Ask Cod3x anything... (/help for commands)" })] })] }));
};
const MessageBubble = ({ message, config }) => {
    const colors = config.ui.colors;
    switch (message.role) {
        case 'user':
            return (_jsxs(Box, { flexDirection: "column", paddingX: 2, paddingY: 1, children: [_jsx(Box, { children: _jsx(Text, { bold: true, color: colors.user, children: "You" }) }), _jsx(Box, { marginLeft: 2, children: _jsx(Text, { children: message.content }) })] }));
        case 'assistant':
            return (_jsxs(Box, { flexDirection: "column", paddingX: 2, paddingY: 1, children: [_jsxs(Box, { children: [_jsx(Text, { bold: true, color: colors.assistant, children: "Cod3x" }), _jsx(Text, { color: "gray", children: " by " }), _jsx(Text, { bold: true, color: "green", children: "CodexHaven" })] }), _jsx(Box, { marginLeft: 2, children: _jsx(Text, { children: message.content }) })] }));
        case 'system':
            return (_jsx(Box, { paddingX: 2, paddingY: 1, children: _jsx(Text, { color: colors.muted, children: message.content }) }));
        default:
            return (_jsx(Box, { paddingX: 2, paddingY: 1, children: _jsx(Text, { children: message.content }) }));
    }
};
const Spinner = () => {
    const [frame, setFrame] = React.useState(0);
    const frames = ['\u28B2', '\u28B6', '\u28B7', '\u28BF', '\u28FB', '\u28F9', '\u28E9', '\u28CB'];
    React.useEffect(() => {
        const interval = setInterval(() => setFrame((prev) => (prev + 1) % frames.length), 80);
        return () => clearInterval(interval);
    }, []);
    return _jsx(Text, { children: frames[frame] });
};
export default ChatInterface;
//# sourceMappingURL=chat.js.map