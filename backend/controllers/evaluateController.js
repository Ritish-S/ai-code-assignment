function analyzeCodeStructure(code) {
    const lines = code.split("\n").length;

    const hasComments = code.includes("//") || code.includes("#");

    const loopCount =
        (code.match(/for\s*\(/g) || []).length +
        (code.match(/while\s*\(/g) || []).length;

    const functionCount =
        (code.match(/function\s/g) || []).length +
        (code.match(/def\s/g) || []).length;

    const longVariableNames =
        (code.match(/[a-zA-Z]{12,}/g) || []).length;

    return {
        lines,
        hasComments,
        loopCount,
        functionCount,
        longVariableNames
    };
}

function computeBaseScores(metrics) {
    let readability = metrics.hasComments ? 80 : 60;

    if (metrics.longVariableNames > 3) readability += 5;

    let efficiency = 90;
    if (metrics.loopCount >= 2) efficiency -= 20;

    let design = metrics.functionCount > 0 ? 85 : 65;

    return {
        readability,
        efficiency,
        design
    };
}

function generateHumanFeedback(metrics, scores) {
    let strengths = [];
    let improvements = [];

    if (metrics.functionCount > 0)
        strengths.push("Code is modular with function usage.");
    else
        improvements.push("Consider breaking logic into functions.");

    if (metrics.hasComments)
        strengths.push("Includes comments improving readability.");
    else
        improvements.push("Add comments to explain logic.");

    if (metrics.loopCount >= 2)
        improvements.push("Nested loops detected. Optimize to reduce time complexity.");

    if (metrics.loopCount === 0)
        strengths.push("Efficient iteration strategy.");

    return { strengths, improvements };
}

function checkSyntax(code, language) {
    const lines = code.split('\n');
    if (language === 'Python') {
        // Common Python typos to check
        const typos = [
            { wrong: 'ef ', correct: 'def ' },
            { wrong: 'prit(', correct: 'print(' },
            { wrong: 'df ', correct: 'def ' },
            { wrong: 'init ', correct: '__init__ ' },
            { wrong: 'inint ', correct: '__init__ ' },
            // Add more as needed
        ];

        for (const typo of typos) {
            if (code.includes(typo.wrong) && !code.includes(typo.correct)) {
                const lineIndex = lines.findIndex(line => line.includes(typo.wrong));
                if (lineIndex !== -1) {
                    return `Syntax Error in Python on line ${lineIndex + 1}: '${typo.wrong.trim()}' should be '${typo.correct.trim()}'`;
                }
            }
        }

        // Check for prnt as before
        if (code.includes('prnt(')) {
            const lineIndex = lines.findIndex(line => line.includes('prnt('));
            return `Syntax Error in Python on line ${lineIndex + 1}: 'prnt' should be 'print'`;
        }

        return null; // No error
    } else if (language === 'Java') {
        let hasClass = false;
        let classLine = -1;
        let hasMain = false;
        let mainLine = -1;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.includes('class') && !hasClass) {
                hasClass = true;
                classLine = i + 1;
            }
            if (line.includes('public static void main') && !hasMain) {
                hasMain = true;
                mainLine = i + 1;
            }
        }
        if (!hasClass) {
            return "Syntax Error in Java: Missing class declaration";
        }
        if (!hasMain) {
            return "Syntax Error in Java: Missing 'public static void main' method";
        }
        // Check for common misspellings
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.includes('clas') && !line.includes('class')) {
                return `Syntax Error in Java on line ${i + 1}: 'clas' should be 'class'`;
            }
            if (line.includes('pulic') && !line.includes('public')) {
                return `Syntax Error in Java on line ${i + 1}: 'pulic' should be 'public'`;
            }
            // Add more if needed
        }
    } else if (language === 'C++') {
        let hasMain = false;
        let mainLine = -1;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.includes('int main') && !hasMain) {
                hasMain = true;
                mainLine = i + 1;
            }
        }
        if (!hasMain) {
            return "Syntax Error in C++: Missing 'int main' function";
        }

        // Common C++ typos
        const typos = [
            { wrong: 'vec<', correct: 'vector<' },
            { wrong: 'cot ', correct: 'cout ' },
            { wrong: 'fr(', correct: 'for(' },
            { wrong: 'incude ', correct: 'include ' },
            { wrong: 'usng ', correct: 'using ' },
            // Add more as needed
        ];

        for (const typo of typos) {
            if (code.includes(typo.wrong) && !code.includes(typo.correct)) {
                const lineIndex = lines.findIndex(line => line.includes(typo.wrong));
                if (lineIndex !== -1) {
                    return `Syntax Error in C++ on line ${lineIndex + 1}: '${typo.wrong.trim()}' should be '${typo.correct.trim()}'`;
                }
            }
        }

        // Check for missing semicolons (basic)
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line.match(/^\s*(int|void|char|float|double)\s+\w+\s*\([^)]*$/) && !line.includes(';') && !line.includes('{')) {
                return `Syntax Error in C++ on line ${i + 1}: Missing semicolon or opening brace`;
            }
        }
    }
    return null; // No error
}

const postEvaluate = (req, res) => {
    const { code, language } = req.body;

    if (!code) {
        return res.status(400).json({ error: "Code is required" });
    }

    // Check for syntax errors
    const syntaxError = checkSyntax(code, language);
    if (syntaxError) {
        return res.json({ success: false, error: syntaxError });
    }

    const metrics = analyzeCodeStructure(code);

    const scores = computeBaseScores(metrics);

    const feedback = generateHumanFeedback(metrics, scores);

    const overallScore = Math.round(
        (scores.readability + scores.efficiency + scores.design) / 3
    );

    res.json({
        success: true,
        overallScore,
        metrics: {
            readability: scores.readability,
            timeEfficiency: scores.efficiency,
            designQuality: scores.design
        },
        strengths: feedback.strengths,
        improvements: feedback.improvements
    });
};

module.exports = {
    postEvaluate
};