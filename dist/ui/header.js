import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { Box, Text } from 'ink';
export const Header = ({ projectName, model, provider, platform, version, mode }) => {
    return (_jsxs(Box, { flexDirection: "column", borderStyle: "double", borderColor: "cyan", paddingX: 2, paddingY: 1, children: [_jsx(Box, { justifyContent: "center", children: _jsxs(Text, { bold: true, color: "cyan", children: ['\u2554', ''.repeat(45), '\u2557'] }) }), _jsx(Box, { justifyContent: "center", children: _jsxs(Text, { bold: true, color: "green", children: ['\u2551', "  Cod3x Code v", version, " by CodexHaven ", '\u2551'] }) }), _jsx(Box, { justifyContent: "center", children: _jsxs(Text, { bold: true, color: "cyan", children: ['\u255A', ''.repeat(45), '\u255D'] }) }), _jsxs(Box, { justifyContent: "space-between", marginTop: 1, children: [_jsxs(Text, { color: "gray", children: ["Project: ", _jsx(Text, { color: "yellow", children: projectName })] }), _jsxs(Text, { color: "gray", children: ["Model: ", _jsx(Text, { color: "green", children: model })] }), _jsxs(Text, { color: "gray", children: ["Platform: ", _jsx(Text, { color: "magenta", children: platform })] }), _jsxs(Text, { color: "gray", children: ["Mode: ", _jsx(Text, { color: "blue", children: mode })] })] })] }));
};
export default Header;
//# sourceMappingURL=header.js.map