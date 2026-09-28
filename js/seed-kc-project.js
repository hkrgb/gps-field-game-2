/**
 * 從 caritasfsc.edu.hk/mls/kc 匯入長洲社區保育考察專案
 * 在已登入老師的頁面 console 執行：await window.seedKcProject()
 */
window.seedKcProject = async function seedKcProject() {
  const session = Auth.getSession();
  if (!session || session.role !== "teacher") {
    throw new Error("請先以老師身分登入");
  }
  const locations = [
    {
      id: "sec2",
      name: "長洲玉虛宮 (北帝廟)",
      lat: 22.212002,
      lng: 114.027749,
      description: "歷史悠久的廟宇，是長洲太平清醮的中心。到達後請觀察廟內佈置與文物。",
      order: 1,
      images: [],
      questions: [
        { id: "q2_1", type: "text", text: "廟內放置了中國故事十兄弟中的其中兩位，他們是誰呢？", order: 1 },
        { id: "q2_2", type: "text", text: "廟內的左右兩邊牆上各有一幅神獸的陶瓷雕刻，分別是甚麼呢？", order: 2 },
        { id: "q2_3", type: "text", text: "廟內有一銅鐘，上面刻了哪一句祝福語呢？", order: 3 }
      ]
    },
    {
      id: "sec3",
      name: "天后古廟 (近北社新村)",
      lat: 22.204505,
      lng: 114.028731,
      description: "見證長洲漁業發展的重要宗教場所。",
      order: 2,
      images: [],
      questions: [
        { id: "q3_1", type: "text", text: "廟宇位於哪一項社區設施內？", order: 1 },
        { id: "q3_2", type: "text", text: "廟宇大門旁的壁畫是繪畫？還是雕刻？", order: 2 },
        { id: "q3_3", type: "text", text: "廟內放置了一種古時的交通工具，是甚麼呢？", order: 3 }
      ]
    },
    {
      id: "sec4",
      name: "長洲醫院",
      lat: 22.2078,
      lng: 114.031481,
      description: "為長洲居民提供醫療服務的重要設施。",
      order: 3,
      images: [],
      questions: [
        { id: "q4_1", type: "text", text: "長洲醫院的英文名稱是甚麼？", order: 1 },
        { id: "q4_2", type: "text", text: "醫院外牆上展示了哪兩位捐款人名字呢？", order: 2 },
        { id: "q4_3", type: "text", text: "急症室入口的大門是甚麼形狀的？", order: 3 }
      ]
    },
    {
      id: "sec5",
      name: "長洲方便醫院",
      lat: 22.206927,
      lng: 114.031034,
      description: "歷史遺跡，昔日為貧苦大眾提供醫療及殮葬服務。",
      order: 4,
      images: [],
      questions: [
        { id: "q5_1", type: "text", text: "方便醫院旁有一座單層小建築，它原有的用途是甚麼呢？", order: 1 },
        { id: "q5_2", type: "text", text: "方便醫院附近有一塊紀念碑，刻上了這建築物創立人的名字，他是誰？", order: 2 }
      ]
    },
    {
      id: "sec6",
      name: "長洲戲院",
      lat: 22.208477,
      lng: 114.028198,
      description: "香港最古老的戰前戲院之一，現已活化。",
      order: 5,
      images: [],
      questions: [
        { id: "q6_1", type: "text", text: "觀察長洲戲院的牌匾，其中一個字的字體是特別不同的，請把它寫出來。", order: 1 },
        { id: "q6_2", type: "text", text: "長洲戲院內的座椅是甚麼顏色？", order: 2 }
      ]
    }
  ];

  const project = await DataStore.createProject(session.uid, {
    slug: "cheungchau-kc",
    title: "長洲社區保育考察",
    subtitle: "從社區保育看可持續發展",
    gpsRadiusMeters: 50,
    fontSize: "base",
    showTestMode: true,
    teacherEmail: session.email || ""
  });

  for (const loc of locations) {
    const { id, ...rest } = loc;
    await DataStore.upsertLocation(project.id, id, rest);
  }

  // 預設隊伍（對齊常見組別用法）
  const teams = [
    { name: "第1組", password: "1234" },
    { name: "第2組", password: "1234" },
    { name: "第3組", password: "1234" },
    { name: "示範隊", password: "demo" }
  ];
  for (const t of teams) {
    await DataStore.upsertTeam(project.id, null, t);
  }

  return {
    projectId: project.id,
    slug: project.slug,
    title: project.title,
    locationCount: locations.length,
    teamCount: teams.length,
    studentUrl: location.origin + "/?p=cheungchau-kc"
  };
};
