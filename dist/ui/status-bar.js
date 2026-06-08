import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Box, Text } from 'ink';
export const StatusBar = ({ status, model, tools, agents, files, tokens, platform, mode }) => {
    return (_jsxs(Box, { borderStyle: "single", borderColor: "gray", paddingX: 1, justifyContent: "space-between", children: [_jsxs(Text, { color: status === 'Ready' ? 'green' : 'yellow', children: ["Status: ", status] }), _jsx(Text, { color: "gray", children: "|" }), _jsx(Text, { color: "green", children: model }), _jsx(Text, { color: "gray", children: "|" }), _jsxs(Text, { color: "yellow", children: ["Tools:", tools] }), _jsx(Text, { color: "gray", children: "|" }), _jsxs(Text, { color: "magenta", children: ["Agents:", agents] }), _jsx(Text, { color: "gray", children: "|" }), _jsxs(Text, { color: "blue", children: ["Files:", files] }), _jsx(Text, { color: "gray", children: "|" }), _jsxs(Text, { color: "cyan", children: ["Tokens:", tokens.toLocaleString()] }), _jsx(Text, { color: "gray", children: "|" }), _jsx(Text, { color: "red", children: platform })] }));
};
export default StatusBar;
//# sourceMappingURL=status-bar.js.map