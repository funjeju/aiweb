/**
 * 별 아카이브 정적 데이터
 * /star/[slug] 페이지 및 별 도감 카드에 사용
 */

export interface StarArchiveData {
  slug: string;
  nameEn: string;
  nameKo: string;
  constellation: { en: string; ko: string };
  distanceLy: number;          // 광년
  magnitude: number;           // 겉보기 등급
  spectralType: string;        // 분광형
  luminosity: string;          // 태양 대비 광도
  radius: string;              // 태양 대비 반지름
  observableRegions: { en: string; ko: string }[];
  bestSeasons: { en: string; ko: string }[];
  shortDesc: { en: string; ko: string };
  longDesc: { en: string; ko: string };
  mythology: { culture: { en: string; ko: string }; story: { en: string; ko: string } }[];
  imageCredit?: string;
}

export const STAR_ARCHIVE: Record<string, StarArchiveData> = {
  sirius: {
    slug: "sirius", nameEn: "Sirius", nameKo: "시리우스",
    constellation: { en: "Canis Major", ko: "큰개자리" },
    distanceLy: 8.6, magnitude: -1.46, spectralType: "A1V",
    luminosity: "25× Sun", radius: "1.7× Sun",
    observableRegions: [{ en: "Worldwide (above 73°S)", ko: "전 세계 (남위 73° 이상)" }],
    bestSeasons: [{ en: "Winter (Jan–Feb)", ko: "겨울 (1~2월)" }],
    shortDesc: {
      en: "The brightest star in the night sky.",
      ko: "밤하늘에서 가장 밝은 별.",
    },
    longDesc: {
      en: "Sirius, also known as the Dog Star, is the brightest star visible from Earth. It is a binary star system consisting of Sirius A, a main-sequence star twice as massive as the Sun, and Sirius B, a faint white dwarf. Ancient Egyptians used its heliacal rising to predict the annual flooding of the Nile.",
      ko: "시리우스는 '개의 별'로도 불리며, 지구에서 가장 밝게 보이는 항성입니다. 태양 질량의 두 배인 주계열성 시리우스 A와 희미한 백색왜성 시리우스 B로 구성된 쌍성계입니다. 고대 이집트인들은 시리우스의 새벽 출현을 통해 나일강의 범람을 예측했습니다.",
    },
    mythology: [
      {
        culture: { en: "Ancient Egypt", ko: "고대 이집트" },
        story: {
          en: "Called 'Sopdet', its heliacal rising marked the beginning of the Nile flood season and the Egyptian new year. It was associated with the goddess Isis.",
          ko: "'소프데트'라 불렸으며, 새벽에 처음 보이는 날이 나일강 범람의 시작을 알렸고 이집트 새해를 뜻했습니다. 여신 이시스와 연결되었습니다.",
        },
      },
      {
        culture: { en: "Greek Mythology", ko: "그리스 신화" },
        story: {
          en: "Known as the 'Dog Star', it represented Orion's faithful hunting dog. Its rise in summer was blamed for heat waves — the origin of the phrase 'dog days of summer'.",
          ko: "'개의 별'로 알려져 오리온의 충직한 사냥개를 상징했습니다. 여름에 떠오르는 시기가 폭염과 관련된다 하여 'dog days(복중)'라는 표현의 기원이 되었습니다.",
        },
      },
      {
        culture: { en: "East Asian Astronomy", ko: "동양 천문학" },
        story: {
          en: "In Chinese astronomy, Sirius was called Tiānláng (天狼), the 'Heavenly Wolf', part of the Well mansion. It was an omen star associated with invasions.",
          ko: "중국 천문학에서는 '천랑(天狼)'이라 불렸으며 침략의 조짐을 나타내는 별로 여겨졌습니다.",
        },
      },
    ],
  },

  vega: {
    slug: "vega", nameEn: "Vega", nameKo: "베가",
    constellation: { en: "Lyra", ko: "거문고자리" },
    distanceLy: 25, magnitude: 0.03, spectralType: "A0V",
    luminosity: "40× Sun", radius: "2.4× Sun",
    observableRegions: [{ en: "Northern Hemisphere, parts of Southern", ko: "북반구 및 남반구 일부" }],
    bestSeasons: [{ en: "Summer (Jul–Aug)", ko: "여름 (7~8월)" }],
    shortDesc: {
      en: "The brightest star in Lyra and the second brightest in the northern sky.",
      ko: "거문고자리에서 가장 밝은 별이자 북반구 하늘에서 두 번째로 밝은 별.",
    },
    longDesc: {
      en: "Vega was the North Star around 12,000 BCE and will be again in 13,727 CE due to Earth's axial precession. It was one of the first stars to have its distance measured and was among the earliest stars to be photographed. NASA's Voyager 1 is heading toward Vega — it will pass within 1.6 light years in about 40,000 years.",
      ko: "베가는 지구 세차운동으로 인해 기원전 12,000년경 북극성이었으며, 서기 13,727년에 다시 북극성이 될 예정입니다. 거리가 최초로 측정된 별 중 하나이며, 사진 촬영도 가장 먼저 이루어진 별 중 하나입니다.",
    },
    mythology: [
      {
        culture: { en: "East Asian (Tanabata)", ko: "동양 (칠석)" },
        story: {
          en: "Vega represents Orihime (織姫), the weaving princess, separated from her lover Altair (Hikoboshi) by the Milky Way. They reunite once a year on the 7th day of the 7th lunar month — the origin of Japan's Tanabata and Korea's Chilseok festival.",
          ko: "베가는 직녀(織女)를 상징하며, 은하수로 가로막혀 견우(알타이르)와 매년 음력 7월 7일 단 하루만 만납니다. 한국의 칠석과 일본의 타나바타 축제의 기원입니다.",
        },
      },
      {
        culture: { en: "Greek Mythology", ko: "그리스 신화" },
        story: {
          en: "Associated with the lyre of Orpheus. When Orpheus was killed, Zeus placed the lyre in the sky as the constellation Lyra, with Vega as its brightest star.",
          ko: "오르페우스의 리라와 연결됩니다. 오르페우스가 죽은 후 제우스가 그의 리라를 하늘에 올려 거문고자리로 만들었고, 베가가 그 중심 별입니다.",
        },
      },
    ],
  },

  polaris: {
    slug: "polaris", nameEn: "Polaris", nameKo: "폴라리스",
    constellation: { en: "Ursa Minor", ko: "작은곰자리" },
    distanceLy: 433, magnitude: 1.98, spectralType: "F7Ib",
    luminosity: "2500× Sun", radius: "46× Sun",
    observableRegions: [{ en: "Northern Hemisphere (circumpolar)", ko: "북반구 (연중 관측 가능)" }],
    bestSeasons: [{ en: "Year-round", ko: "연중" }],
    shortDesc: {
      en: "The North Star — has guided navigators for thousands of years.",
      ko: "북극성 — 수천 년 동안 항해자들의 길잡이가 되어온 별.",
    },
    longDesc: {
      en: "Polaris sits nearly directly above Earth's North Pole, making it appear almost stationary in the sky while all other stars rotate around it. It is actually a triple star system. Due to Earth's axial precession, Polaris won't always be the North Star — Vega will take its place around 13,727 CE. It is a Cepheid variable star, pulsating slightly in brightness.",
      ko: "폴라리스는 지구 북극 바로 위에 위치하여 다른 별들이 회전하는 동안 거의 고정된 것처럼 보입니다. 실제로는 세 개의 별로 이루어진 삼중성계입니다. 지구의 세차운동으로 인해 영원한 북극성은 아니며, 서기 13,727년경 베가가 그 자리를 대신할 예정입니다.",
    },
    mythology: [
      {
        culture: { en: "Navigation History", ko: "항해 역사" },
        story: {
          en: "For centuries, sailors used Polaris to determine their latitude at sea. Its altitude above the horizon equals the observer's latitude, making it an invaluable navigation tool before the age of GPS.",
          ko: "수 세기 동안 선원들은 폴라리스를 이용해 바다에서 위도를 측정했습니다. 지평선 위의 높이가 관찰자의 위도와 같아 GPS 이전 시대의 필수 항해 도구였습니다.",
        },
      },
      {
        culture: { en: "Native American", ko: "아메리카 원주민" },
        story: {
          en: "Many Native American tribes called Polaris the 'Star That Does Not Walk Around', recognizing its fixed position in the sky as a spiritual anchor point.",
          ko: "많은 아메리카 원주민 부족은 폴라리스를 '걸어다니지 않는 별'이라 불렀으며, 하늘의 영적 기준점으로 여겼습니다.",
        },
      },
    ],
  },

  betelgeuse: {
    slug: "betelgeuse", nameEn: "Betelgeuse", nameKo: "베텔게우스",
    constellation: { en: "Orion", ko: "오리온자리" },
    distanceLy: 700, magnitude: 0.42, spectralType: "M1-M2 Ia",
    luminosity: "100,000× Sun", radius: "700× Sun",
    observableRegions: [{ en: "Worldwide (above 82°S)", ko: "전 세계 (남위 82° 이상)" }],
    bestSeasons: [{ en: "Winter (Dec–Feb)", ko: "겨울 (12~2월)" }],
    shortDesc: {
      en: "A red supergiant nearing the end of its life — destined to explode as a supernova.",
      ko: "생의 끝을 향해 달려가는 적색초거성 — 언젠가 초신성 폭발을 맞이할 별.",
    },
    longDesc: {
      en: "Betelgeuse is one of the largest and most luminous stars visible to the naked eye. If placed at the center of our solar system, it would engulf everything out to Jupiter. It is a semi-regular variable star, famously dimming dramatically in 2019–2020 in what astronomers called the 'Great Dimming', sparking speculation about an imminent supernova. When it eventually explodes, it will be visible in daylight for weeks.",
      ko: "베텔게우스는 육안으로 볼 수 있는 가장 크고 밝은 별 중 하나입니다. 태양계 중심에 놓이면 목성 궤도까지 삼킬 정도의 크기입니다. 2019~2020년 '대 흐려짐' 사건으로 초신성 폭발 임박설이 제기되기도 했습니다. 폭발하면 수 주간 낮에도 보일 것입니다.",
    },
    mythology: [
      {
        culture: { en: "Arabic Origin", ko: "아랍어 어원" },
        story: {
          en: "The name comes from the Arabic 'Ibt al-Jauzah', meaning 'the armpit of Orion'. It marks the right shoulder (or armpit) of the great hunter in the sky.",
          ko: "이름은 아랍어 '이브트 알 자우자(오리온의 겨드랑이)'에서 유래했습니다. 하늘의 사냥꾼 오리온의 오른쪽 어깨(또는 겨드랑이)를 나타냅니다.",
        },
      },
      {
        culture: { en: "Modern Science", ko: "현대 과학" },
        story: {
          en: "Betelgeuse is one of the most studied stars in astronomy. Its eventual supernova will be a once-in-a-millennium event visible worldwide, releasing more energy in seconds than the Sun will emit in its entire lifetime.",
          ko: "천문학에서 가장 많이 연구되는 별 중 하나입니다. 폭발 시 전 세계에서 관측 가능한 천 년에 한 번의 사건이 될 것이며, 수 초 만에 태양이 전 생애에 방출할 에너지보다 더 많은 에너지를 방출합니다.",
        },
      },
    ],
  },

  rigel: {
    slug: "rigel", nameEn: "Rigel", nameKo: "리겔",
    constellation: { en: "Orion", ko: "오리온자리" },
    distanceLy: 860, magnitude: 0.13, spectralType: "B8 Ia",
    luminosity: "120,000× Sun", radius: "78× Sun",
    observableRegions: [{ en: "Worldwide (above 82°S)", ko: "전 세계 (남위 82° 이상)" }],
    bestSeasons: [{ en: "Winter (Dec–Jan)", ko: "겨울 (12~1월)" }],
    shortDesc: {
      en: "The brightest star in Orion — a blue supergiant of immense power.",
      ko: "오리온자리에서 가장 밝은 별 — 강렬한 청색초거성.",
    },
    longDesc: {
      en: "Rigel is a blue-white supergiant and one of the most intrinsically luminous stars known. Despite being labeled Beta Orionis, it is actually brighter than Alpha Orionis (Betelgeuse) on average. It marks the left foot of Orion and is a navigation star used in celestial navigation.",
      ko: "리겔은 청백색 초거성으로 알려진 가장 밝은 별 중 하나입니다. 베타 오리오니스로 분류되어 있지만 실제로는 알파 오리오니스(베텔게우스)보다 평균적으로 더 밝습니다. 오리온의 왼발을 나타내며 천문 항법에 사용되는 항법성입니다.",
    },
    mythology: [
      {
        culture: { en: "Arabic Origin", ko: "아랍어 어원" },
        story: {
          en: "Rigel comes from the Arabic 'Rijl Jauzah al-Yusra', meaning 'the left leg of the great one'. It has been used as a navigation star by sailors for millennia.",
          ko: "'리젤'은 아랍어 '리즐 자우자 알 유스라(위대한 자의 왼발)'에서 유래했습니다. 수천 년간 선원들의 항법성으로 사용되었습니다.",
        },
      },
    ],
  },

  altair: {
    slug: "altair", nameEn: "Altair", nameKo: "알타이르",
    constellation: { en: "Aquila", ko: "독수리자리" },
    distanceLy: 16.7, magnitude: 0.77, spectralType: "A7V",
    luminosity: "11× Sun", radius: "1.6× Sun",
    observableRegions: [{ en: "Worldwide (above 78°S)", ko: "전 세계 (남위 78° 이상)" }],
    bestSeasons: [{ en: "Summer (Aug–Sep)", ko: "여름 (8~9월)" }],
    shortDesc: {
      en: "One of the Summer Triangle stars — spins so fast it bulges at its equator.",
      ko: "여름의 대삼각형 별 중 하나 — 너무 빨리 자전해 적도 부분이 부풀어 있는 별.",
    },
    longDesc: {
      en: "Altair rotates at an extraordinary speed — about 286 km/s at its equator, compared to the Sun's 2 km/s. This rapid rotation causes it to be noticeably oblate, with its equatorial diameter about 20% larger than its polar diameter. Together with Vega and Deneb, it forms the famous Summer Triangle asterism.",
      ko: "알타이르는 적도에서 약 초속 286km로 자전하며 이는 태양(초속 2km)의 143배에 달합니다. 이 빠른 자전 때문에 적도 지름이 극 지름보다 약 20% 커 납작한 형태를 띱니다. 베가, 데네브와 함께 '여름의 대삼각형'을 이룹니다.",
    },
    mythology: [
      {
        culture: { en: "East Asian (Tanabata)", ko: "동양 (칠석)" },
        story: {
          en: "Altair represents Hikoboshi (彦星), the cowherd, who is separated from his love Orihime (Vega) by the Milky Way. They meet only once a year on the 7th day of the 7th lunar month.",
          ko: "알타이르는 견우(彦星)를 상징하며 은하수를 사이에 두고 직녀(베가)와 이별해 있다가 매년 음력 7월 7일 단 하루 만납니다.",
        },
      },
    ],
  },

  aldebaran: {
    slug: "aldebaran", nameEn: "Aldebaran", nameKo: "알데바란",
    constellation: { en: "Taurus", ko: "황소자리" },
    distanceLy: 65, magnitude: 0.85, spectralType: "K5 III",
    luminosity: "518× Sun", radius: "44× Sun",
    observableRegions: [{ en: "Worldwide (above 75°S)", ko: "전 세계 (남위 75° 이상)" }],
    bestSeasons: [{ en: "Winter (Jan–Feb)", ko: "겨울 (1~2월)" }],
    shortDesc: {
      en: "The fiery red eye of the Bull — a giant star 44 times wider than the Sun.",
      ko: "황소의 타오르는 붉은 눈 — 태양의 44배 크기인 거성.",
    },
    longDesc: {
      en: "Aldebaran is a cool red giant star that appears to be part of the Hyades star cluster but is actually much closer at 65 light years (the Hyades are 150 light years away). NASA's Pioneer 10 spacecraft, launched in 1972, is traveling in the general direction of Aldebaran and will pass within 68 light years of it in about 2 million years.",
      ko: "알데바란은 히아데스 성단의 일원처럼 보이지만 실제로는 65광년 거리로 훨씬 가깝습니다(히아데스는 150광년 거리). 1972년 발사된 파이오니어 10호가 알데바란 방향으로 여행 중이며 약 200만 년 후 68광년 거리로 지나칠 것입니다.",
    },
    mythology: [
      {
        culture: { en: "Arabic Origin", ko: "아랍어 어원" },
        story: {
          en: "'Al-Dabarān' means 'the follower' in Arabic — it follows the Pleiades across the sky. It was one of the four Royal Stars of ancient Persia, associated with the Archangel Michael.",
          ko: "아랍어로 '뒤따르는 자'를 뜻하며, 플레이아데스 성단을 따라 하늘을 가로지릅니다. 고대 페르시아의 네 개 왕실 별 중 하나로 대천사 미카엘과 연결되었습니다.",
        },
      },
    ],
  },

  deneb: {
    slug: "deneb", nameEn: "Deneb", nameKo: "데네브",
    constellation: { en: "Cygnus", ko: "백조자리" },
    distanceLy: 2600, magnitude: 1.25, spectralType: "A2 Ia",
    luminosity: "200,000× Sun", radius: "203× Sun",
    observableRegions: [{ en: "Northern Hemisphere (circumpolar from 45°N+)", ko: "북반구 (북위 45° 이상에서 주극성)" }],
    bestSeasons: [{ en: "Summer (Aug–Sep)", ko: "여름 (8~9월)" }],
    shortDesc: {
      en: "One of the most intrinsically luminous stars — its true brightness dwarfs almost everything.",
      ko: "실제 밝기로 따지면 밤하늘에서 손꼽히는 초고광도 별.",
    },
    longDesc: {
      en: "Despite being about 2,600 light years away — nearly 100 times farther than Vega — Deneb is still one of the brightest stars in the sky. If it were as close as Vega, it would cast shadows at night. It is one of the largest and most luminous stars known. Together with Vega and Altair, it forms the Summer Triangle.",
      ko: "데네브는 베가보다 약 100배 먼 2,600광년 거리에 있음에도 밤하늘에서 가장 밝은 별 중 하나입니다. 만약 베가만큼 가깝다면 밤에 그림자가 생길 정도로 밝을 것입니다. 베가, 알타이르와 함께 여름의 대삼각형을 이룹니다.",
    },
    mythology: [
      {
        culture: { en: "Arabic Origin", ko: "아랍어 어원" },
        story: {
          en: "Deneb means 'tail' in Arabic (dhanab al-dajājah — tail of the hen), marking the tail of Cygnus the Swan. In Chinese astronomy it was part of the 'Celestial Ford' where Vega and Altair meet across the Milky Way.",
          ko: "아랍어로 '꼬리'를 뜻하며(다나브 알 다자자 — 암탉의 꼬리), 백조의 꼬리 부분을 나타냅니다. 중국 천문학에서는 은하수를 건너는 '하늘의 나루터'의 일부였습니다.",
        },
      },
    ],
  },

  arcturus: {
    slug: "arcturus", nameEn: "Arcturus", nameKo: "아르크투루스",
    constellation: { en: "Boötes", ko: "목동자리" },
    distanceLy: 37, magnitude: -0.05, spectralType: "K1.5 III",
    luminosity: "170× Sun", radius: "25× Sun",
    observableRegions: [{ en: "Worldwide (above 71°S)", ko: "전 세계 (남위 71° 이상)" }],
    bestSeasons: [{ en: "Spring (Apr–May)", ko: "봄 (4~5월)" }],
    shortDesc: {
      en: "The brightest star in the northern celestial hemisphere — a golden-orange giant.",
      ko: "북반구 하늘에서 가장 밝은 별 — 황금빛 주황색 거성.",
    },
    longDesc: {
      en: "Arcturus is a red giant star in the final stages of its life, having exhausted its hydrogen core fuel. It moves through the galaxy at high speed relative to the Sun — about 122 km/s — and is thought to be part of a stream of stars that may have been captured from a dwarf galaxy. In 1933, its light was used to turn on the lights at the Chicago World's Fair, having traveled 40 years from the star.",
      ko: "아르크투루스는 수소 핵연료를 다 소진한 노년의 적색거성입니다. 태양에 대해 약 초속 122km의 빠른 속도로 움직이며, 왜소은하에서 포획된 별 무리의 일원으로 추정됩니다. 1933년 시카고 세계박람회에서 40년 전 이 별에서 출발한 빛으로 조명을 켜는 퍼포먼스가 열렸습니다.",
    },
    mythology: [
      {
        culture: { en: "Greek Mythology", ko: "그리스 신화" },
        story: {
          en: "The name means 'Guardian of the Bear' in Greek. Arcturus follows the Great Bear (Ursa Major) around the pole, and was associated with Arcas, son of Zeus and Callisto, who was transformed into Ursa Minor.",
          ko: "이름은 그리스어로 '곰의 수호자'를 뜻합니다. 큰곰(큰곰자리)을 따라 극 주위를 돌며, 제우스와 칼리스토의 아들 아르카스와 연관되어 있습니다.",
        },
      },
    ],
  },

  spica: {
    slug: "spica", nameEn: "Spica", nameKo: "스피카",
    constellation: { en: "Virgo", ko: "처녀자리" },
    distanceLy: 250, magnitude: 1.04, spectralType: "B1 III-IV",
    luminosity: "20,000× Sun", radius: "7× Sun",
    observableRegions: [{ en: "Worldwide (above 65°S)", ko: "전 세계 (남위 65° 이상)" }],
    bestSeasons: [{ en: "Spring (Apr–May)", ko: "봄 (4~5월)" }],
    shortDesc: {
      en: "The brightest star in Virgo — a spectroscopic binary that helped measure Earth's precession.",
      ko: "처녀자리의 가장 밝은 별 — 지구 세차운동 측정에 기여한 쌍성.",
    },
    longDesc: {
      en: "Spica is a close binary star system where both stars are so close they distort each other into egg shapes through tidal forces. Ancient Greek astronomer Hipparchus used Spica's position to discover Earth's axial precession around 127 BCE. You can find Spica by following the arc of the Big Dipper's handle — 'arc to Arcturus, spike to Spica'.",
      ko: "스피카는 두 별이 서로 조석력으로 달걀 모양으로 변형될 만큼 가까운 쌍성계입니다. 기원전 127년경 히파르코스가 스피카의 위치를 이용해 지구의 세차운동을 발견했습니다. '북두칠성 손잡이의 호를 따라 아르크투루스로, 거기서 직진하면 스피카'로 찾을 수 있습니다.",
    },
    mythology: [
      {
        culture: { en: "Roman / Greek", ko: "로마 / 그리스" },
        story: {
          en: "Spica represents the ear of wheat held by Virgo, the goddess of harvest. In Roman mythology, this figure was Ceres (Demeter in Greek), goddess of grain and agriculture.",
          ko: "처녀 여신이 들고 있는 밀 이삭을 상징합니다. 로마 신화에서 이 인물은 곡물과 농업의 여신 케레스(그리스의 데메테르)입니다.",
        },
      },
    ],
  },

  antares: {
    slug: "antares", nameEn: "Antares", nameKo: "안타레스",
    constellation: { en: "Scorpius", ko: "전갈자리" },
    distanceLy: 550, magnitude: 0.96, spectralType: "M1.5 Iab",
    luminosity: "75,000× Sun", radius: "700× Sun",
    observableRegions: [{ en: "Worldwide (above 63°S)", ko: "전 세계 (남위 63° 이상)" }],
    bestSeasons: [{ en: "Summer (Jun–Jul)", ko: "여름 (6~7월)" }],
    shortDesc: {
      en: "The heart of the Scorpion — a red supergiant rivaling Mars in color.",
      ko: "전갈의 심장 — 붉은 빛으로 화성과 경쟁하는 적색초거성.",
    },
    longDesc: {
      en: "Antares means 'rival of Mars' (Anti-Ares) in Greek because its reddish color resembles the Red Planet. It is one of the largest stars visible to the naked eye — if placed at the Sun's location, its outer atmosphere would extend past Jupiter. Like Betelgeuse, it is expected to explode as a supernova within the next million years.",
      ko: "안타레스는 그리스어로 '화성의 경쟁자(안티-아레스)'를 뜻하며, 붉은 빛이 화성과 유사해 붙여진 이름입니다. 육안으로 볼 수 있는 가장 큰 별 중 하나로, 태양 위치에 놓이면 대기가 목성 너머까지 뻗칩니다. 베텔게우스처럼 향후 수백만 년 내 초신성 폭발이 예상됩니다.",
    },
    mythology: [
      {
        culture: { en: "Ancient Persia", ko: "고대 페르시아" },
        story: {
          en: "Antares was one of the four Royal Stars of ancient Persia (along with Aldebaran, Regulus, and Fomalhaut), associated with the archangel Raphael and the season of autumn.",
          ko: "알데바란, 레굴루스, 포말하우트와 함께 고대 페르시아의 네 왕실 별 중 하나로, 대천사 라파엘과 가을을 상징했습니다.",
        },
      },
    ],
  },

  capella: {
    slug: "capella", nameEn: "Capella", nameKo: "카펠라",
    constellation: { en: "Auriga", ko: "마차부자리" },
    distanceLy: 43, magnitude: 0.08, spectralType: "G5 III + G0 III",
    luminosity: "78× Sun", radius: "12× Sun",
    observableRegions: [{ en: "Northern Hemisphere (circumpolar from 44°N+)", ko: "북반구 (북위 44° 이상에서 주극성)" }],
    bestSeasons: [{ en: "Winter (Jan–Feb)", ko: "겨울 (1~2월)" }],
    shortDesc: {
      en: "The sixth brightest star — actually two giant yellow stars orbiting each other.",
      ko: "여섯 번째로 밝은 별 — 실제로는 두 개의 거대한 노란 별이 서로를 공전하는 쌍성.",
    },
    longDesc: {
      en: "Capella consists of two yellow giant stars so close together they can't be separated by the naked eye. They orbit each other every 104 days and are very similar to what our Sun will look like in about 5 billion years. The name means 'little goat' in Latin, and Capella is the brightest circumpolar star from most of the northern hemisphere.",
      ko: "카펠라는 맨눈으로 구별할 수 없을 만큼 가까이 있는 두 개의 황색 거성으로 구성됩니다. 약 104일 주기로 서로를 공전하며, 약 50억 년 후 우리 태양의 모습과 매우 유사합니다. 라틴어로 '작은 염소'를 뜻하며, 북반구 대부분 지역에서 주극성인 가장 밝은 별입니다.",
    },
    mythology: [
      {
        culture: { en: "Greek Mythology", ko: "그리스 신화" },
        story: {
          en: "Capella represents the goat Amalthea who nursed the infant Zeus. When Zeus accidentally broke one of her horns, he turned it into the Cornucopia — the horn of plenty — as compensation.",
          ko: "어린 제우스에게 젖을 먹인 염소 아말테아를 상징합니다. 제우스가 실수로 그녀의 뿔을 부러뜨리자, 보상으로 풍요의 뿔(코르누코피아)로 만들어주었습니다.",
        },
      },
    ],
  },

  fomalhaut: {
    slug: "fomalhaut", nameEn: "Fomalhaut", nameKo: "포말하우트",
    constellation: { en: "Piscis Austrinus", ko: "남쪽물고기자리" },
    distanceLy: 25, magnitude: 1.16, spectralType: "A3V",
    luminosity: "16× Sun", radius: "1.8× Sun",
    observableRegions: [{ en: "Worldwide (above 65°N)", ko: "전 세계 (북위 65° 이하)" }],
    bestSeasons: [{ en: "Autumn (Oct–Nov)", ko: "가을 (10~11월)" }],
    shortDesc: {
      en: "The loneliest bright star — isolated in an otherwise dim patch of sky, it was called the 'Autumn Star'.",
      ko: "가을 밤하늘에 홀로 빛나는 외로운 별 — '가을의 별'로 불렸다.",
    },
    longDesc: {
      en: "Fomalhaut is surrounded by a ring of dust and debris — a protoplanetary disk — that has been directly imaged by the Hubble Space Telescope. A candidate exoplanet, Fomalhaut b (nicknamed 'Dagon'), was once thought to orbit within this ring, though it is now thought to be the remnant of a destroyed comet. It was one of the four Royal Stars of ancient Persia.",
      ko: "포말하우트 주위에는 허블 우주망원경으로 직접 촬영된 먼지와 잔해로 이루어진 원시행성 원반이 있습니다. '다곤'이라 불리는 외계행성 후보가 이 고리 안에서 공전하는 것으로 여겨졌으나, 현재는 파괴된 혜성의 잔해로 추정됩니다. 고대 페르시아의 네 왕실 별 중 하나였습니다.",
    },
    mythology: [
      {
        culture: { en: "Ancient Persia", ko: "고대 페르시아" },
        story: {
          en: "One of the four Royal Stars of Persia, Fomalhaut was associated with the archangel Gabriel and winter. The name comes from Arabic 'fam al-ḥūt', meaning 'mouth of the fish'.",
          ko: "페르시아 네 왕실 별 중 하나로 대천사 가브리엘과 겨울을 상징했습니다. 이름은 아랍어 '팜 알 후트(물고기의 입)'에서 유래했습니다.",
        },
      },
    ],
  },

  regulus: {
    slug: "regulus", nameEn: "Regulus", nameKo: "레굴루스",
    constellation: { en: "Leo", ko: "사자자리" },
    distanceLy: 79, magnitude: 1.35, spectralType: "B7V",
    luminosity: "360× Sun", radius: "3.1× Sun",
    observableRegions: [{ en: "Worldwide (above 75°S)", ko: "전 세계 (남위 75° 이상)" }],
    bestSeasons: [{ en: "Spring (Mar–Apr)", ko: "봄 (3~4월)" }],
    shortDesc: {
      en: "The heart of the Lion — a rapidly spinning star nearly as fast as it can go without flying apart.",
      ko: "사자의 심장 — 분해되기 직전까지 빠르게 자전하는 별.",
    },
    longDesc: {
      en: "Regulus rotates so fast — about 96% of the speed at which centrifugal force would tear it apart — that it is noticeably oblate. Its equatorial diameter is about 32% larger than its polar diameter. It lies almost exactly on the ecliptic, so it is regularly occulted by the Moon and occasionally by planets.",
      ko: "레굴루스는 원심력으로 분해되는 속도의 약 96%로 자전하여 눈에 띄게 납작한 모양입니다. 적도 지름이 극 지름보다 약 32% 큽니다. 황도면에 거의 정확히 위치하여 달과 행성에 의해 주기적으로 엄폐됩니다.",
    },
    mythology: [
      {
        culture: { en: "Ancient Babylonia", ko: "고대 바빌로니아" },
        story: {
          en: "Regulus was one of the four Royal Stars of ancient Babylon, called 'Sharru' meaning 'the King'. It was associated with Gilgamesh and considered the most important of the four Royal Stars.",
          ko: "'샤루(왕)'를 뜻하는 이름으로 바빌로니아 네 왕실 별 중 하나였습니다. 길가메시와 연관되어 네 왕실 별 중 가장 중요하게 여겨졌습니다.",
        },
      },
    ],
  },

  pollux: {
    slug: "pollux", nameEn: "Pollux", nameKo: "폴룩스",
    constellation: { en: "Gemini", ko: "쌍둥이자리" },
    distanceLy: 34, magnitude: 1.14, spectralType: "K0 III",
    luminosity: "32× Sun", radius: "9× Sun",
    observableRegions: [{ en: "Worldwide (above 62°S)", ko: "전 세계 (남위 62° 이상)" }],
    bestSeasons: [{ en: "Winter (Feb–Mar)", ko: "겨울 (2~3월)" }],
    shortDesc: {
      en: "The brighter of the celestial twins — and one of the nearest giant stars with a confirmed exoplanet.",
      ko: "하늘의 쌍둥이 중 더 밝은 별 — 외계행성이 확인된 가장 가까운 거성 중 하나.",
    },
    longDesc: {
      en: "Despite being labeled Beta Geminorum, Pollux is actually brighter than its twin Castor (Alpha Geminorum). In 2006, an exoplanet called Pollux b (now Thestias) was confirmed in orbit around it, making Pollux one of the nearest stars with a confirmed planetary companion. The star's orange color contrasts beautifully with Castor's blue-white hue.",
      ko: "베타 제미노룸으로 분류되어 있지만 실제로는 쌍둥이 카스토르보다 더 밝습니다. 2006년 폴룩스 b(현재 테스티아스)라는 외계행성이 확인되어 외계행성을 가진 가장 가까운 별 중 하나가 되었습니다. 주황빛이 카스토르의 청백색과 아름답게 대비됩니다.",
    },
    mythology: [
      {
        culture: { en: "Greek Mythology", ko: "그리스 신화" },
        story: {
          en: "Pollux and Castor were the Dioscuri, twin sons of Leda. Pollux was immortal (son of Zeus) while Castor was mortal (son of King Tyndareus). When Castor died, Pollux asked Zeus to share his immortality — so they alternate between Olympus and Hades, always together.",
          ko: "폴룩스와 카스토르는 레다의 쌍둥이 아들 디오스쿠로이입니다. 폴룩스는 불멸(제우스의 아들), 카스토르는 필멸(튄다레오스 왕의 아들)이었습니다. 카스토르가 죽자 폴룩스는 제우스에게 불멸을 나눠달라고 청하여 둘이 번갈아 올림포스와 하데스를 오가게 되었습니다.",
        },
      },
    ],
  },

  castor: {
    slug: "castor", nameEn: "Castor", nameKo: "카스토르",
    constellation: { en: "Gemini", ko: "쌍둥이자리" },
    distanceLy: 52, magnitude: 1.57, spectralType: "A2V",
    luminosity: "52× Sun", radius: "2.4× Sun",
    observableRegions: [{ en: "Worldwide (above 62°S)", ko: "전 세계 (남위 62° 이상)" }],
    bestSeasons: [{ en: "Winter (Feb–Mar)", ko: "겨울 (2~3월)" }],
    shortDesc: { en: "Six stars in one — Castor is actually a sextuple star system.", ko: "하나처럼 보이지만 실제로는 여섯 개의 별로 이루어진 다중성계." },
    longDesc: { en: "Despite appearing as a single point of light, Castor is actually a hierarchical system of six stars — three pairs of binary stars orbiting each other. It is labeled Alpha Geminorum but is dimmer than its twin Pollux (Beta Geminorum), making it one of the most famous cases of mislabeled stellar designations.", ko: "하나의 빛으로 보이지만 카스토르는 세 쌍의 쌍성이 서로 공전하는 6중성계입니다. 알파 제미노룸으로 분류되어 있지만 실제로는 베타(폴룩스)보다 어두운, 천문학 역사상 유명한 오분류 사례 중 하나입니다." },
    mythology: [{ culture: { en: "Greek Mythology", ko: "그리스 신화" }, story: { en: "Castor and Pollux were the Dioscuri, twin sons of Leda. Castor was mortal while Pollux was divine. They were the patron gods of sailors, and the 'St. Elmo's Fire' phenomenon on ships was said to be their presence protecting the vessel.", ko: "카스토르와 폴룩스는 레다의 쌍둥이 아들 디오스쿠로이입니다. 카스토르는 필멸, 폴룩스는 불멸이었습니다. 선원들의 수호신으로 숭배되었으며 배에 나타나는 '성 엘모의 불' 현상이 그들의 존재를 나타낸다고 믿었습니다." } }],
  },

  procyon: {
    slug: "procyon", nameEn: "Procyon", nameKo: "프로키온",
    constellation: { en: "Canis Minor", ko: "작은개자리" },
    distanceLy: 11.5, magnitude: 0.34, spectralType: "F5IV-V",
    luminosity: "7× Sun", radius: "2× Sun",
    observableRegions: [{ en: "Worldwide (above 75°S)", ko: "전 세계 (남위 75° 이상)" }],
    bestSeasons: [{ en: "Winter (Feb–Mar)", ko: "겨울 (2~3월)" }],
    shortDesc: { en: "The Little Dog Star — one of the closest bright stars to Earth.", ko: "작은 개의 별 — 지구에서 가장 가까운 밝은 별 중 하나." },
    longDesc: { en: "Procyon means 'before the dog' in Greek, as it rises just before Sirius (the Dog Star) in the sky. It is one of the nearest stars to Earth at only 11.5 light years. Like Sirius, it has a white dwarf companion — Procyon B — that was predicted to exist 30 years before it was actually observed. It forms the Winter Triangle with Sirius and Betelgeuse.", ko: "프로키온은 그리스어로 '개의 앞(先)'을 뜻하며, 시리우스보다 먼저 떠오르기 때문에 붙여진 이름입니다. 지구에서 11.5광년밖에 안 되는 가까운 별로, 시리우스처럼 백색왜성 동반성(프로키온 B)을 가집니다. 시리우스, 베텔게우스와 함께 '겨울의 대삼각형'을 이룹니다." },
    mythology: [{ culture: { en: "Ancient Egypt", ko: "고대 이집트" }, story: { en: "The Egyptians called it 'the star of the crossing of the water dog', associating it with the flooding of the Nile and the god Anubis.", ko: "고대 이집트에서는 '물개가 건너는 별'이라 불렀으며 나일강 범람과 아누비스 신과 연결지었습니다." } }],
  },

  achernar: {
    slug: "achernar", nameEn: "Achernar", nameKo: "아케르나르",
    constellation: { en: "Eridanus", ko: "에리다누스자리" },
    distanceLy: 139, magnitude: 0.46, spectralType: "B6Vep",
    luminosity: "3150× Sun", radius: "7.3× Sun",
    observableRegions: [{ en: "Southern Hemisphere, tropics", ko: "남반구 및 열대 지방" }],
    bestSeasons: [{ en: "Autumn (Nov–Dec, Southern)", ko: "남반구 가을 (11~12월)" }],
    shortDesc: { en: "The flattest star known — spins so fast it's 56% wider than it is tall.", ko: "알려진 별 중 가장 납작한 별 — 너무 빨리 자전해 너비가 높이보다 56% 더 길다." },
    longDesc: { en: "Achernar rotates so rapidly that its equatorial diameter is about 1.56 times its polar diameter — making it the most oblate star known. It marks the end of the celestial river Eridanus. The name comes from Arabic 'ākhir al-nahr' meaning 'end of the river'. It is the ninth brightest star in the sky and a southern hemisphere landmark.", ko: "아케르나르는 적도 지름이 극 지름의 약 1.56배로 알려진 별 중 가장 납작합니다. 하늘의 강 에리다누스의 끝을 표시하며 아랍어 '아키르 알 나르(강의 끝)'에서 이름이 유래했습니다. 하늘에서 아홉 번째로 밝은 별로 남반구의 랜드마크입니다." },
    mythology: [{ culture: { en: "Arabic Origin", ko: "아랍어 어원" }, story: { en: "As the 'end of the river', Achernar was seen as the mouth where the celestial river Eridanus (associated with the mythological rivers Nile, Po, and Euphrates) empties into the cosmic ocean.", ko: "'강의 끝'으로서, 신화 속 에리다누스 강(나일강, 포강, 유프라테스강과 연결)이 우주의 바다로 흘러드는 하구로 여겨졌습니다." } }],
  },

  hadar: {
    slug: "hadar", nameEn: "Hadar", nameKo: "하다르",
    constellation: { en: "Centaurus", ko: "켄타우루스자리" },
    distanceLy: 390, magnitude: 0.61, spectralType: "B1 III",
    luminosity: "41,700× Sun", radius: "9× Sun",
    observableRegions: [{ en: "Southern Hemisphere, tropics", ko: "남반구 및 열대 지방" }],
    bestSeasons: [{ en: "Spring (Apr–May, Southern)", ko: "남반구 봄 (4~5월)" }],
    shortDesc: { en: "Second star of the Southern Pointers — used for millennia to find the Southern Cross.", ko: "남십자성을 찾는 남반구의 길잡이 별 중 두 번째." },
    longDesc: { en: "Hadar (also known as Beta Centauri) is the second brightest star in Centaurus, and together with Rigil Kentaurus forms 'The Pointers' — two stars that indicate the direction of the Southern Cross. Despite appearing close together, Hadar is about 45 times farther away than Rigil Kentaurus.", ko: "하다르(베타 켄타우리)는 켄타우루스자리에서 두 번째로 밝은 별로, 리길 켄타우루스와 함께 남십자성 방향을 가리키는 '포인터' 쌍을 이룹니다. 함께 가까이 보이지만 실제로는 리길 켄타우루스보다 약 45배 더 멀리 있습니다." },
    mythology: [{ culture: { en: "Southern Navigation", ko: "남반구 항법" }, story: { en: "Aboriginal Australians used the Pointers (Hadar and Rigil Kentaurus) to navigate the continent for tens of thousands of years, associating them with sacred songlines.", ko: "호주 원주민들은 수만 년간 이 포인터 쌍을 이용해 대륙을 항해했으며, 신성한 '송라인'과 연결지었습니다." } }],
  },

  mimosa: {
    slug: "mimosa", nameEn: "Mimosa", nameKo: "미모사",
    constellation: { en: "Crux", ko: "남십자자리" },
    distanceLy: 280, magnitude: 1.25, spectralType: "B0.5 III",
    luminosity: "34,000× Sun", radius: "8.4× Sun",
    observableRegions: [{ en: "Southern Hemisphere, tropics", ko: "남반구 및 열대 지방" }],
    bestSeasons: [{ en: "Spring (Apr–May, Southern)", ko: "남반구 봄 (4~5월)" }],
    shortDesc: { en: "The second brightest star in the Southern Cross — a symbol of the southern sky.", ko: "남십자성의 두 번째로 밝은 별 — 남반구 하늘의 상징." },
    longDesc: { en: "Mimosa (Beta Crucis) is the second brightest star in the Southern Cross (Crux), which is the smallest constellation in the sky but one of the most distinctive. The Southern Cross appears on the flags of Australia, New Zealand, Brazil, Papua New Guinea, and Samoa. Mimosa has a companion star and shows characteristics of a giant star that will eventually become a neutron star.", ko: "미모사(베타 크루키스)는 하늘에서 가장 작은 별자리인 남십자자리에서 두 번째로 밝은 별입니다. 남십자자리는 호주, 뉴질랜드, 브라질, 파푸아뉴기니, 사모아의 국기에 등장합니다. 미모사는 동반성을 가지며, 결국 중성자별이 될 거성의 특성을 보입니다." },
    mythology: [{ culture: { en: "Indigenous Australians", ko: "호주 원주민" }, story: { en: "The Southern Cross (Crux), including Mimosa, was central to Aboriginal Australian navigation and storytelling. The Emu in the Sky — a dark constellation formed by the absence of stars — uses the Coal Sack nebula near the Southern Cross as the emu's head.", ko: "미모사가 속한 남십자자리는 호주 원주민의 항법과 이야기에 핵심이었습니다. 별이 없는 어두운 공간으로 이루어진 '하늘의 에뮤' 별자리는 남십자자리 근처의 석탄자루 성운을 에뮤의 머리로 사용합니다." } }],
  },

  acrux: {
    slug: "acrux", nameEn: "Acrux", nameKo: "아크룩스",
    constellation: { en: "Crux", ko: "남십자자리" },
    distanceLy: 320, magnitude: 0.77, spectralType: "B0.5 IV",
    luminosity: "25,000× Sun", radius: "7.8× Sun",
    observableRegions: [{ en: "Southern Hemisphere (circumpolar below 25°N)", ko: "남반구 (북위 25° 이하에서 주극성)" }],
    bestSeasons: [{ en: "Spring (Apr–May, Southern)", ko: "남반구 봄 (4~5월)" }],
    shortDesc: { en: "The brightest star in the Southern Cross — the south's answer to Polaris.", ko: "남십자성에서 가장 밝은 별 — 남반구의 폴라리스." },
    longDesc: { en: "Acrux (Alpha Crucis) is the brightest star in the Southern Cross and the 13th brightest in the night sky. It is not visible from most of Europe or North America. For centuries, sailors in the southern hemisphere used the Southern Cross to determine south, analogous to how northern navigators used Polaris. Acrux itself is a triple star system.", ko: "아크룩스(알파 크루키스)는 남십자자리에서 가장 밝은 별이자 밤하늘 전체에서 13번째로 밝습니다. 유럽이나 북미 대부분에서는 볼 수 없습니다. 수 세기 동안 남반구 선원들은 북반구에서 폴라리스를 쓰듯 남십자자리를 이용해 남쪽을 찾았습니다. 아크룩스는 3중성계입니다." },
    mythology: [{ culture: { en: "Colonial Navigation", ko: "식민지 시대 항법" }, story: { en: "European explorers in the 15th-16th centuries considered the Southern Cross a divine gift for navigation in unknown waters. Amerigo Vespucci and others recorded it as a miraculous guide that confirmed they had reached new worlds.", ko: "15~16세기 유럽 탐험가들은 남십자자리를 미지의 바다에서의 신성한 항법 선물로 여겼습니다. 아메리고 베스푸치 등은 새로운 세계에 도달했음을 확인시켜준 기적의 길잡이로 기록했습니다." } }],
  },

  dubhe: {
    slug: "dubhe", nameEn: "Dubhe", nameKo: "두브헤",
    constellation: { en: "Ursa Major", ko: "큰곰자리" },
    distanceLy: 124, magnitude: 1.79, spectralType: "K0 III",
    luminosity: "316× Sun", radius: "30× Sun",
    observableRegions: [{ en: "Northern Hemisphere (circumpolar)", ko: "북반구 (주극성)" }],
    bestSeasons: [{ en: "Year-round", ko: "연중" }],
    shortDesc: { en: "One of the 'Pointers' — guides you straight to the North Star.", ko: "북두칠성의 '포인터' — 이 별에서 직선으로 따라가면 북극성." },
    longDesc: { en: "Dubhe and Merak are the two outermost stars of the Big Dipper's bowl and are called 'The Pointers' because a line through them, extended five times the distance between them, leads directly to Polaris. Dubhe is one of the most reliable navigation aids in the northern sky. It moves in the opposite direction from most of the other Big Dipper stars.", ko: "두브헤와 메라크는 북두칠성 국자 바깥쪽 두 별로 '포인터'라 불립니다. 이 두 별을 잇는 선을 그 간격의 5배만큼 연장하면 정확히 폴라리스에 닿습니다. 북반구에서 가장 신뢰할 수 있는 항법 도구 중 하나입니다." },
    mythology: [{ culture: { en: "Global Cultures", ko: "세계 각지" }, story: { en: "The Big Dipper (containing Dubhe) is one of the most culturally significant asterisms worldwide. In ancient China it was the 'Northern Dipper', in Hindu astronomy the 'Seven Sages', in Native American traditions a bear and hunters, and in Europe the Plough or Wagon.", ko: "두브헤가 속한 북두칠성은 세계에서 문화적으로 가장 중요한 별무리 중 하나입니다. 고대 중국에서는 '북두(北斗)', 힌두 천문학에서는 '칠현인', 아메리카 원주민 전통에서는 곰과 사냥꾼, 유럽에서는 쟁기나 마차로 불렸습니다." } }],
  },

  alioth: {
    slug: "alioth", nameEn: "Alioth", nameKo: "알리오트",
    constellation: { en: "Ursa Major", ko: "큰곰자리" },
    distanceLy: 83, magnitude: 1.76, spectralType: "A0p",
    luminosity: "108× Sun", radius: "4× Sun",
    observableRegions: [{ en: "Northern Hemisphere (circumpolar)", ko: "북반구 (주극성)" }],
    bestSeasons: [{ en: "Year-round", ko: "연중" }],
    shortDesc: { en: "The brightest star in Ursa Major — the handle of the Big Dipper's start.", ko: "큰곰자리에서 가장 밝은 별 — 북두칠성 손잡이의 시작점." },
    longDesc: { en: "Alioth is the brightest star in Ursa Major and the epsilon star, located at the 'tail' where the handle of the Big Dipper begins. It is a peculiar A-type star (Ap star) with unusual atmospheric chemistry due to magnetic fields causing elemental segregation. Its spectrum shows unusual overabundances of europium, chromium, and other rare elements.", ko: "알리오트는 큰곰자리에서 가장 밝은 별로, 북두칠성 손잡이가 시작되는 '꼬리' 부분에 위치합니다. 자기장으로 인한 원소 분리 때문에 비정상적인 대기 화학을 가진 특이 A형 별(Ap별)로, 유로퓸, 크로뮴 등 희귀 원소가 비정상적으로 풍부합니다." },
    mythology: [{ culture: { en: "Arabic Origin", ko: "아랍어 어원" }, story: { en: "The name Alioth comes from Arabic 'alyat', meaning 'the fat tail of a sheep'. In many ancient cultures, the Big Dipper's stars were associated with animals — Alioth was part of a bear, a sheep, or oxen pulling a plough.", ko: "알리오트라는 이름은 아랍어 '알야트(양의 기름진 꼬리)'에서 유래했습니다. 많은 고대 문화에서 북두칠성은 동물과 연관되었는데, 알리오트는 곰, 양, 또는 쟁기를 끄는 소의 일부로 여겨졌습니다." } }],
  },

  kochab: {
    slug: "kochab", nameEn: "Kochab", nameKo: "코카브",
    constellation: { en: "Ursa Minor", ko: "작은곰자리" },
    distanceLy: 131, magnitude: 2.08, spectralType: "K4 III",
    luminosity: "390× Sun", radius: "42× Sun",
    observableRegions: [{ en: "Northern Hemisphere (circumpolar)", ko: "북반구 (주극성)" }],
    bestSeasons: [{ en: "Year-round", ko: "연중" }],
    shortDesc: { en: "The former North Star — was the pole star 3000 years ago.", ko: "과거의 북극성 — 3000년 전에는 이 별이 북쪽 하늘의 중심이었다." },
    longDesc: { en: "Due to Earth's axial precession, the pole star changes over thousands of years. Kochab was the North Star from about 1500 BCE to 500 CE — the era of ancient Egypt's New Kingdom, classical Greece, and the Roman Empire. Navigators and astronomers of those civilizations oriented by Kochab, not Polaris. It will be the North Star again around 7500 CE.", ko: "지구의 세차운동으로 북극성은 수천 년에 걸쳐 바뀝니다. 코카브는 기원전 1500년부터 서기 500년경까지 북극성이었습니다 — 이집트 신왕국, 고대 그리스, 로마 제국의 시대입니다. 그 시대의 항해자들과 천문학자들은 폴라리스가 아닌 코카브를 기준으로 삼았습니다. 서기 7500년경 다시 북극성이 됩니다." },
    mythology: [{ culture: { en: "Ancient Greece", ko: "고대 그리스" }, story: { en: "The ancient Greeks called Kochab and its neighbor Pherkad 'the Guardians of the Pole'. Thales of Miletus (624–546 BCE) advised Greek sailors to use Ursa Minor (and thus Kochab) for navigation, a more accurate method than using Ursa Major.", ko: "고대 그리스인들은 코카브와 이웃한 페르카드를 '극의 수호자'라 불렀습니다. 탈레스(기원전 624~546)는 그리스 선원들에게 큰곰자리보다 더 정확한 항법을 위해 작은곰자리(코카브)를 사용하라고 조언했습니다." } }],
  },

  mizar: {
    slug: "mizar", nameEn: "Mizar", nameKo: "미자르",
    constellation: { en: "Ursa Major", ko: "큰곰자리" },
    distanceLy: 83, magnitude: 2.23, spectralType: "A2V",
    luminosity: "33× Sun", radius: "2.4× Sun",
    observableRegions: [{ en: "Northern Hemisphere (circumpolar)", ko: "북반구 (주극성)" }],
    bestSeasons: [{ en: "Year-round", ko: "연중" }],
    shortDesc: { en: "The first double star ever discovered — and an ancient vision test.", ko: "최초로 발견된 이중성 — 고대에는 시력 검사로 사용됐다." },
    longDesc: { en: "Mizar was the first telescopic double star to be discovered (1617) and later the first spectroscopic binary identified. Its companion Alcor (just 0.2° away) was used as a vision test by Roman armies — soldiers who could see Alcor were considered fit for duty. Mizar itself is a quadruple star system. Together, Mizar and Alcor form a visual double called 'the horse and rider'.", ko: "미자르는 최초로 발견된 망원경 이중성(1617년)이자 최초의 분광 쌍성입니다. 동반성 알코르(0.2° 거리)는 로마 군대에서 시력 테스트로 사용됐습니다 — 알코르를 볼 수 있는 병사만 복무 적합 판정을 받았습니다. 미자르 자체는 4중성계이며 알코르와 함께 '말과 기수'로 불리는 시각적 이중성을 이룹니다." },
    mythology: [{ culture: { en: "Islamic Astronomy", ko: "이슬람 천문학" }, story: { en: "Arab astronomers called Mizar 'Marāqq' (the loins) and Alcor 'al-Sadak' (the test), referring to its use as a vision test. The pair was one of the most studied objects in medieval Islamic astronomy.", ko: "아랍 천문학자들은 미자르를 '마라크(허리)', 알코르를 '알 사닥(시험)'이라 불렀습니다. 이 쌍은 중세 이슬람 천문학에서 가장 많이 연구된 천체 중 하나였습니다." } }],
  },

  mirfak: {
    slug: "mirfak", nameEn: "Mirfak", nameKo: "미르파크",
    constellation: { en: "Perseus", ko: "페르세우스자리" },
    distanceLy: 590, magnitude: 1.79, spectralType: "F5 Ib",
    luminosity: "5000× Sun", radius: "68× Sun",
    observableRegions: [{ en: "Northern Hemisphere (circumpolar from 30°N+)", ko: "북반구 (북위 30° 이상에서 주극성)" }],
    bestSeasons: [{ en: "Autumn/Winter (Nov–Jan)", ko: "가을/겨울 (11~1월)" }],
    shortDesc: { en: "The brightest star in Perseus — a supergiant at the heart of a moving star cluster.", ko: "페르세우스자리에서 가장 밝은 별 — 이동 성단의 중심에 있는 초거성." },
    longDesc: { en: "Mirfak is a yellow-white supergiant and the brightest star in Perseus. It is surrounded by the Alpha Persei Cluster (Melotte 20), a group of young stars 400–600 light years away that are moving together through space. This makes Mirfak one of the few naked-eye stars that is clearly embedded within a visible star cluster.", ko: "미르파크는 황백색 초거성으로 페르세우스자리에서 가장 밝습니다. 400~600광년 거리에서 함께 이동하는 젊은 별들의 집단인 알파 페르세이 성단(멜로트 20)에 둘러싸여 있습니다. 육안으로 보이는 별이 선명하게 성단 안에 위치한 드문 사례입니다." },
    mythology: [{ culture: { en: "Greek Mythology", ko: "그리스 신화" }, story: { en: "Mirfak lies in the constellation Perseus, the hero who slew Medusa and rescued Andromeda. The name comes from Arabic 'mirfaq al-thurayya', meaning 'the elbow'. Perseus is one of the oldest constellations, appearing in ancient Babylonian star catalogs.", ko: "미르파크는 메두사를 처치하고 안드로메다를 구한 영웅 페르세우스 별자리에 위치합니다. 이름은 아랍어 '미르파크 알 수라야야(팔꿈치)'에서 유래했습니다. 페르세우스는 고대 바빌로니아 성표에도 등장하는 가장 오래된 별자리 중 하나입니다." } }],
  },

  schedar: {
    slug: "schedar", nameEn: "Schedar", nameKo: "셰다르",
    constellation: { en: "Cassiopeia", ko: "카시오페이아자리" },
    distanceLy: 228, magnitude: 2.24, spectralType: "K0 IIa",
    luminosity: "855× Sun", radius: "45× Sun",
    observableRegions: [{ en: "Northern Hemisphere (circumpolar)", ko: "북반구 (주극성)" }],
    bestSeasons: [{ en: "Year-round", ko: "연중" }],
    shortDesc: { en: "The brightest star in Cassiopeia — part of the W-shape visible from northern latitudes all year.", ko: "카시오페이아자리에서 가장 밝은 별 — 북반구에서 연중 볼 수 있는 W자 형태의 핵심." },
    longDesc: { en: "Schedar is the brightest star in Cassiopeia, one of the most recognizable constellations in the northern sky. Its distinctive W or M shape, along with the Big Dipper, has served as a navigation aid for millennia. Schedar is an orange giant that has expanded beyond the main sequence and is near the end of its active life.", ko: "셰다르는 북반구 하늘에서 가장 알아보기 쉬운 별자리 카시오페이아에서 가장 밝은 별입니다. 북두칠성과 함께 특유의 W 또는 M 형태로 수천 년간 항법 도구로 사용되었습니다. 셰다르는 주계열성을 벗어나 팽창한 주황색 거성으로 활동 수명이 거의 끝나가고 있습니다." },
    mythology: [{ culture: { en: "Greek Mythology", ko: "그리스 신화" }, story: { en: "Cassiopeia was an Ethiopian queen who boasted that she and her daughter Andromeda were more beautiful than the Nereids. Poseidon, angered by this, sent a sea monster (Cetus) to ravage the coast. Cassiopeia was placed in the sky as punishment, circling the pole so she sometimes hangs upside down.", ko: "카시오페이아는 자신과 딸 안드로메다가 네레이데스보다 더 아름답다고 자랑한 에티오피아 여왕이었습니다. 분노한 포세이돈이 바다 괴물(케투스)을 보내 해안을 황폐화시켰습니다. 카시오페이아는 벌로 하늘에 올려져 극 주위를 돌며 때로는 거꾸로 매달립니다." } }],
  },

  alpheratz: {
    slug: "alpheratz", nameEn: "Alpheratz", nameKo: "알페라츠",
    constellation: { en: "Andromeda", ko: "안드로메다자리" },
    distanceLy: 97, magnitude: 2.07, spectralType: "B8 IV",
    luminosity: "200× Sun", radius: "2.7× Sun",
    observableRegions: [{ en: "Worldwide (above 60°S)", ko: "전 세계 (남위 60° 이상)" }],
    bestSeasons: [{ en: "Autumn (Oct–Nov)", ko: "가을 (10~11월)" }],
    shortDesc: { en: "The head of Andromeda — also forms the corner of the Great Square of Pegasus.", ko: "안드로메다의 머리 — 동시에 페가수스 사각형의 한 꼭짓점." },
    longDesc: { en: "Alpheratz (or Sirrah) is the brightest star in Andromeda and is also considered to form one corner of the Great Square of Pegasus. It was historically shared between both constellations and was once known as Delta Pegasi. It is a hot subgiant that rotates rapidly. From Alpheratz you can find the Andromeda Galaxy (M31), the nearest large galaxy to the Milky Way.", ko: "알페라츠(또는 시라)는 안드로메다자리에서 가장 밝은 별이자 페가수스 대사각형의 한 꼭짓점을 이룹니다. 역사적으로 두 별자리 사이에 공유되어 한때 델타 페가시로도 불렸습니다. 알페라츠에서 은하수에서 가장 가까운 대형 은하인 안드로메다 은하(M31)를 찾을 수 있습니다." },
    mythology: [{ culture: { en: "Greek Mythology", ko: "그리스 신화" }, story: { en: "Andromeda was the daughter of Cassiopeia and Cepheus, chained to a rock as a sacrifice to the sea monster Cetus. Perseus rescued her and they married. All five figures — Perseus, Andromeda, Cassiopeia, Cepheus, and Cetus — are immortalized as neighboring constellations.", ko: "안드로메다는 카시오페이아와 케페우스의 딸로, 바다 괴물 케투스에게 제물로 바위에 묶였습니다. 페르세우스가 그녀를 구해 결혼했습니다. 다섯 인물 — 페르세우스, 안드로메다, 카시오페이아, 케페우스, 케투스 — 모두 이웃한 별자리로 하늘에 올려졌습니다." } }],
  },

  denebola: {
    slug: "denebola", nameEn: "Denebola", nameKo: "데네볼라",
    constellation: { en: "Leo", ko: "사자자리" },
    distanceLy: 36, magnitude: 2.14, spectralType: "A3V",
    luminosity: "15× Sun", radius: "1.7× Sun",
    observableRegions: [{ en: "Worldwide (above 68°S)", ko: "전 세계 (남위 68° 이상)" }],
    bestSeasons: [{ en: "Spring (Apr–May)", ko: "봄 (4~5월)" }],
    shortDesc: { en: "The tail of the Lion — a young star surrounded by a debris disk.", ko: "사자의 꼬리 — 잔해 원반에 둘러싸인 젊은 별." },
    longDesc: { en: "Denebola means 'tail of the lion' in Arabic. It is a young star (only about 400 million years old) that emits far more infrared radiation than expected, suggesting it is surrounded by a debris disk — potentially a sign of planet formation. Together with Arcturus and Spica, it forms the Spring Triangle, a prominent seasonal asterism.", ko: "'사자의 꼬리'를 뜻하는 아랍어에서 이름이 유래했습니다. 약 4억 년밖에 되지 않은 젊은 별로 예상보다 훨씬 많은 적외선을 방출하며, 이는 행성 형성의 징후일 수 있는 잔해 원반에 둘러싸여 있음을 시사합니다. 아르크투루스, 스피카와 함께 봄의 대삼각형을 이룹니다." },
    mythology: [{ culture: { en: "Medieval Astrology", ko: "중세 점성술" }, story: { en: "In medieval astrology, Denebola was considered an unfortunate star associated with swift judgment and misfortune. However, it was also linked to intelligence and eloquence when well-aspected. It marked the tail of the lion in Mesopotamian star catalogs dating to at least 1200 BCE.", ko: "중세 점성술에서 데네볼라는 빠른 심판과 불운을 상징하는 불길한 별로 여겨졌습니다. 그러나 긍정적인 측면으로 보면 지성과 웅변과 연결되기도 했습니다. 기원전 1200년 이전의 메소포타미아 성표에도 사자의 꼬리로 등장합니다." } }],
  },

  sadr: {
    slug: "sadr", nameEn: "Sadr", nameKo: "사드르",
    constellation: { en: "Cygnus", ko: "백조자리" },
    distanceLy: 1500, magnitude: 2.23, spectralType: "F8 Ib",
    luminosity: "33,000× Sun", radius: "150× Sun",
    observableRegions: [{ en: "Northern Hemisphere (circumpolar from 40°N+)", ko: "북반구 (북위 40° 이상에서 주극성)" }],
    bestSeasons: [{ en: "Summer (Aug–Sep)", ko: "여름 (8~9월)" }],
    shortDesc: { en: "The heart of the Swan — at the center of the Northern Cross.", ko: "백조의 심장 — 북십자성의 정중앙에 위치한 별." },
    longDesc: { en: "Sadr (Gamma Cygni) sits at the center of the Northern Cross, an asterism formed by the brightest stars in Cygnus. This position makes it the intersection of the cross. The surrounding region is filled with emission nebulae, including the Sadr Region (IC 1318), a complex of glowing hydrogen gas clouds that are spectacular in long-exposure astrophotography.", ko: "사드르(감마 시그니)는 백조자리 밝은 별들로 이루어진 북십자성의 정중앙에 위치합니다. 주변은 방출성운으로 가득 찬 지역으로, '사드르 지역(IC 1318)'이라 불리는 빛나는 수소 가스 구름 복합체는 장노출 천체사진에서 장관을 이룹니다." },
    mythology: [{ culture: { en: "Arabic Origin", ko: "아랍어 어원" }, story: { en: "Sadr means 'chest' in Arabic (sadr al-dajājah — breast of the hen), as it marks the breast of Cygnus the Swan. In the sky mythology, Cygnus represents Zeus transformed into a swan to seduce Leda, or the swan of Orpheus placed in the sky after his death.", ko: "'사드르'는 아랍어로 '가슴(사드르 알 다자자 — 암탉의 가슴)'을 뜻하며 백조의 가슴 부분을 표시합니다. 신화에서 백조자리는 레다를 유혹하기 위해 백조로 변신한 제우스, 또는 죽은 후 하늘에 올려진 오르페우스의 백조를 상징합니다." } }],
  },

  albireo: {
    slug: "albireo", nameEn: "Albireo", nameKo: "알비레오",
    constellation: { en: "Cygnus", ko: "백조자리" },
    distanceLy: 430, magnitude: 3.05, spectralType: "K3 II + B0V",
    luminosity: "950× Sun", radius: "17× Sun",
    observableRegions: [{ en: "Northern Hemisphere, tropics", ko: "북반구 및 열대 지방" }],
    bestSeasons: [{ en: "Summer (Aug–Sep)", ko: "여름 (8~9월)" }],
    shortDesc: { en: "The most beautiful double star — a gold-and-blue pair visible in small telescopes.", ko: "가장 아름다운 이중성 — 소형 망원경으로도 금빛과 파란빛이 선명하게 보이는 별 쌍." },
    longDesc: { en: "Albireo appears as a single star to the naked eye but through even a small telescope reveals one of the most breathtaking sights in astronomy — a vivid orange-gold star paired with a sapphire-blue companion. The color contrast arises because the two stars have very different temperatures: the orange star is about 4,400K while the blue star is over 13,000K. Whether they form a true binary or are just a line-of-sight pair is still debated.", ko: "알비레오는 맨눈으로는 하나의 별처럼 보이지만 소형 망원경으로 보면 천문학에서 가장 아름다운 광경 중 하나를 드러냅니다 — 황금빛 주황색 별과 사파이어 파란색 동반성의 선명한 대비. 이 색 대비는 두 별의 온도 차이(주황색 약 4,400K, 파란색 13,000K 이상)에서 비롯됩니다." },
    mythology: [{ culture: { en: "Amateur Astronomy", ko: "아마추어 천문학" }, story: { en: "Albireo is perhaps the most beloved target for amateur astronomers and often the first 'wow moment' for people looking through a telescope for the first time. Its beauty has introduced countless people to the joy of stargazing.", ko: "알비레오는 아마추어 천문학자들이 가장 사랑하는 관측 대상 중 하나로, 처음 망원경을 들여다본 사람들에게 '와우 순간'을 선사하는 별입니다. 수많은 사람들을 별 관측의 즐거움으로 이끈 별입니다." } }],
  },

  rasalhague: {
    slug: "rasalhague", nameEn: "Rasalhague", nameKo: "라살하게",
    constellation: { en: "Ophiuchus", ko: "뱀주인자리" },
    distanceLy: 47, magnitude: 2.08, spectralType: "A5 III",
    luminosity: "25× Sun", radius: "2.6× Sun",
    observableRegions: [{ en: "Worldwide (above 59°S)", ko: "전 세계 (남위 59° 이상)" }],
    bestSeasons: [{ en: "Summer (Jun–Jul)", ko: "여름 (6~7월)" }],
    shortDesc: { en: "The head of the Serpent Bearer — in the 13th zodiac sign that astrology forgot.", ko: "뱀주인의 머리 — 점성술이 잊어버린 13번째 황도궁의 별." },
    longDesc: { en: "Rasalhague marks the head of Ophiuchus, the Serpent Bearer. Ophiuchus is actually a zodiacal constellation — the Sun passes through it for about 18 days each year (Nov 30 – Dec 18) — but traditional Western astrology uses only 12 signs and excludes it. The name means 'the head of the serpent collector' in Arabic.", ko: "라살하게는 뱀주인자리의 머리 부분을 나타냅니다. 뱀주인자리는 실제로 황도 별자리입니다 — 태양이 매년 약 18일(11월 30일~12월 18일) 동안 지나갑니다 — 그러나 전통 서양 점성술은 12궁만 사용하여 제외했습니다. 이름은 아랍어로 '뱀을 잡는 자의 머리'를 뜻합니다." },
    mythology: [{ culture: { en: "Greek Mythology", ko: "그리스 신화" }, story: { en: "Ophiuchus is identified with Asclepius, the god of medicine, who could raise the dead. Zeus killed him with a thunderbolt to prevent an imbalance between life and death, then placed him in the sky. The caduceus (snake-entwined staff), symbol of medicine, derives from this myth.", ko: "뱀주인자리는 죽은 자를 살릴 수 있었던 의술의 신 아스클레피오스와 동일시됩니다. 제우스는 생과 사의 균형을 깨뜨릴까 두려워 그를 번개로 처치한 뒤 하늘에 올렸습니다. 의학의 상징인 뱀이 감긴 지팡이(카두케우스)가 이 신화에서 유래했습니다." } }],
  },

  hamal: {
    slug: "hamal", nameEn: "Hamal", nameKo: "하말",
    constellation: { en: "Aries", ko: "양자리" },
    distanceLy: 66, magnitude: 2.01, spectralType: "K2 III",
    luminosity: "91× Sun", radius: "15× Sun",
    observableRegions: [{ en: "Worldwide (above 60°S)", ko: "전 세계 (남위 60° 이상)" }],
    bestSeasons: [{ en: "Autumn/Winter (Nov–Dec)", ko: "가을/겨울 (11~12월)" }],
    shortDesc: { en: "The brightest star in Aries — marked the vernal equinox 2000 years ago.", ko: "양자리에서 가장 밝은 별 — 2000년 전 춘분점을 표시했던 별." },
    longDesc: { en: "Hamal was the closest bright star to the vernal equinox (the 'First Point of Aries') around 2000 years ago. Due to Earth's precession, the vernal equinox has since shifted to Pisces and is moving toward Aquarius. The 'Age of Aries' (approximately 2000 BCE – 1 CE) was named after this coincidence. The name comes from Arabic 'ra's al-ḥamal' meaning 'head of the ram'.", ko: "하말은 약 2000년 전 춘분점('양자리의 첫 번째 점')에 가장 가까운 밝은 별이었습니다. 지구의 세차운동으로 춘분점은 이미 물고기자리로 이동했고 물병자리 방향으로 계속 이동 중입니다. '양자리 시대'(기원전 2000년~서기 1년)가 이 시기를 가리킵니다. 이름은 아랍어 '라스 알 하말(양의 머리)'에서 유래했습니다." },
    mythology: [{ culture: { en: "Ancient Babylonia", ko: "고대 바빌로니아" }, story: { en: "Aries, the Ram, represented the golden fleece of Chrysomallus, the flying ram that rescued Phrixus and Helle. Jason and the Argonauts sought this golden fleece. In Babylonian astronomy, Aries was 'the hired man' and marked the beginning of the astronomical year.", ko: "양자리의 숫양은 프릭소스와 헬레를 구한 날아다니는 숫양 크리소말루스의 황금 양털을 상징합니다. 이아손과 아르고 원정대가 이 황금 양털을 찾아 떠났습니다. 바빌로니아 천문학에서 양자리는 '고용된 사람'이었으며 천문학적 한 해의 시작을 표시했습니다." } }],
  },
};

export function getStarArchive(slug: string): StarArchiveData | null {
  return STAR_ARCHIVE[slug] ?? null;
}

/** 아카이브에 등록된 모든 slug 목록 */
export function getAllStarSlugs(): string[] {
  return Object.keys(STAR_ARCHIVE);
}

/** 영문명 → slug 변환 (Gemini 반환값 정규화용) */
export function nameToSlug(nameEn: string): string {
  return nameEn.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}
