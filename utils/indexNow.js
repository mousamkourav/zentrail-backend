
export async function indexNowSubmit({ domain, url }) {
  try {
    const key = process.env.INDEXNOW_KEY ;

    const keyLocation = `https://${domain}/${key}.txt`;

    const body = {
      host: domain,
      key,
      keyLocation,
      urlList: [url], 
    };

    const response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const result = await response.text();
    console.log("IndexNow Response:", result);
    return result;

  } catch (error) {
    console.error("IndexNow ERROR:", error);
    return null;
  }
}
