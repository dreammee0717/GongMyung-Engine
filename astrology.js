const fetch = require('node-fetch');

exports.handler = async function(event, context) {
    const API_KEY = process.env.ASTROLOGY_API_KEY;
    const USER_ID = process.env.ASTROLOGY_USER_ID;

    // --- 문제 진단 코드 시작 ---
    if (!API_KEY || !USER_ID) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "API 키 또는 User ID가 Netlify에 설정되지 않았습니다." })
        };
    }
    // --- 문제 진단 코드 끝 ---

    const API_ENDPOINT = 'https://json.astrologyapi.com/v1/planets';

    const now = new Date();
    const data = {
        day: now.getDate(),
        month: now.getMonth() + 1,
        year: now.getFullYear(),
        hour: now.getHours(),
        min: now.getMinutes(),
        lat: 37.38, // 정선군 위도
        lon: 128.66, // 정선군 경도
        tzone: 9,    // 한국 시간대
    };

    try {
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': "Basic " + Buffer.from(USER_ID + ":" + API_KEY).toString('base64'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error("API 서버 오류:", errorBody);
            return { statusCode: response.status, body: JSON.stringify({ error: 'API 서버에서 오류가 발생했습니다.' }) };
        }

        const planetData = await response.json();

        let aspectScore = 0;
        const positions = {};
        const majorPlanets = ['Sun', 'Moon', 'Mars', 'Jupiter', 'Saturn', 'Mercury', 'Venus'];
        planetData.forEach(p => {
            if (majorPlanets.includes(p.name)) {
                positions[p.name] = p.fullDegree;
            }
        });

        const planets = Object.keys(positions);
        for (let i = 0; i < planets.length; i++) {
            for (let j = i + 1; j < planets.length; j++) {
                let angle = Math.abs(positions[planets[i]] - positions[planets[j]]);
                if (angle > 180) angle = 360 - angle;

                if (angle <= 10) aspectScore += 5;
                else if (angle >= 55 && angle <= 65) aspectScore += 8;
                else if (angle >= 85 && angle <= 95) aspectScore -= 7;
                else if (angle >= 115 && angle <= 125) aspectScore += 10;
                else if (angle >= 175) aspectScore -= 10;
            }
        }

        return {
            statusCode: 200,
            body: JSON.stringify({ totalScore: aspectScore })
        };

    } catch (error) {
        console.error("함수 실행 오류:", error);
        return { statusCode: 500, body: JSON.stringify({ error: error.toString() }) };
    }
};
