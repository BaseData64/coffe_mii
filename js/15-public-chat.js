/* ============================================================
   MAKI'S BIO V23 — extracted from index.html
   Original inline script #15
   Mode: ES MODULE
   ============================================================ */

import {
    initializeApp,
    getApp,
    getApps
}
from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";

import {
    getAuth,
    onAuthStateChanged
}
from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

import {
    getDatabase,
    ref,
    get,
    set,
    push,
    remove,
    onValue,
    query,
    orderByChild,
    limitToLast,
    serverTimestamp
}
from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";


const makiChatFirebaseConfig = {
    apiKey: "AIzaSyBC1CU5NvbyYvgb6W2nbxAWXtdPV63qhnA",
    authDomain: "maki-s-bio.firebaseapp.com",
    databaseURL: "https://maki-s-bio-default-rtdb.firebaseio.com",
    projectId: "maki-s-bio",
    storageBucket: "maki-s-bio.firebasestorage.app",
    messagingSenderId: "267692056127",
    appId: "1:267692056127:web:472b5f1ca8c82db4a3228a"
};

const makiChatApp =
    getApps().length > 0
        ? getApp()
        : initializeApp(makiChatFirebaseConfig);

const makiChatAuth = getAuth(makiChatApp);
const makiChatDB = getDatabase(makiChatApp);

const MAKI_OWNER_PNID = "YosMakii99_PN";
const MAX_CHAT_POSTS = 100;
const MAX_PUBLIC_IMAGE_DATAURL = 950000;

let makiChatUser = null;
let makiChatPnid = "";
let makiChatPosts = [];
let makiChatAdmins = {};
let makiChatVerified = {};
let makiChatYeahs = {};
let makiPageYeahs = {};
let makiMiiNameCache = {};
let makiSelectedPostId = null;

let stopPosts = null;
let stopAdmins = null;
let stopVerified = null;
let stopYeahs = null;
let stopPageYeahs = null;


/* ============================================================
   HELPERS
   ============================================================ */

function escapeChatHTML(value) {
    return String(value ?? "").replace(
        /[&<>"']/g,
        function(char) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#39;"
            }[char];
        }
    );
}

async function resolveMiiName(pnid) {
    const clean = String(pnid || "").trim();
    if (!clean) return "User";
    if (makiMiiNameCache[clean]) return makiMiiNameCache[clean];

    try {
        const response = await fetch(
            "https://mii-unsecure.ariankordi.net/mii_data/" +
            encodeURIComponent(clean) +
            "?api_id=1"
        );

        if (response.ok) {
            const data = await response.json();
            const name =
                data?.name ||
                data?.miiName ||
                data?.mii?.name ||
                clean;

            makiMiiNameCache[clean] = String(name);
            return String(name);
        }
    } catch (error) {
        console.warn("No se pudo obtener el nombre del Mii:", error);
    }

    makiMiiNameCache[clean] = clean;
    return clean;
}

function chatDisplayName(post) {
    const pnid = String(post?.autor || "");
    return String(
        post?.miiName ||
        makiMiiNameCache[pnid] ||
        pnid ||
        "User"
    );
}

async function hydrateMiiNames(posts) {
    const pnids = [...new Set(
        (posts || []).map(p => String(p?.autor || "").trim()).filter(Boolean)
    )];

    await Promise.all(
        pnids.map(async function(pnid) {
            const stored = (posts || []).find(
                p => String(p?.autor || "") === pnid && String(p?.miiName || "").trim()
            );
            if (stored) {
                makiMiiNameCache[pnid] = String(stored.miiName);
            } else {
                await resolveMiiName(pnid);
            }
        })
    );

    renderRealChat();
    renderChatYeahControlsEverywhere();
}

function safeExpression(value) {
    const expression = String(value || "normal");

    return /^[a-zA-Z0-9_-]{1,32}$/.test(expression)
        ? expression
        : "normal";
}

function getCurrentExpression() {
    const active =
        document.querySelector(
            "#modal-crear-post .emocion-btn.activo"
        );

    if (active && active.dataset.exp) {
        return safeExpression(active.dataset.exp);
    }

    const selectedByStyle =
        Array.from(
            document.querySelectorAll(
                "#modal-crear-post .emocion-btn"
            )
        ).find(function(button) {
            return (
                button.style.backgroundColor === "rgb(121, 193, 0)" ||
                button.style.backgroundColor === "#79c100"
            );
        });

    return selectedByStyle && selectedByStyle.dataset.exp
        ? safeExpression(selectedByStyle.dataset.exp)
        : "normal";
}

function getSelectedImageDataUrl() {
    const button =
        document.getElementById("select-image-post");

    const preview =
        document.getElementById("preview-imagen-post");

    if (
        !button ||
        !preview ||
        !button.classList.contains("tiene-imagen")
    ) {
        return null;
    }

    const src =
        preview.getAttribute("src") ||
        preview.src ||
        "";

    if (
        !src.startsWith("data:image/jpeg;base64,") &&
        !src.startsWith("data:image/png;base64,") &&
        !src.startsWith("data:image/webp;base64,")
    ) {
        return null;
    }

    return src;
}

function isDrawingMode() {
    const text =
        document.getElementById("texto-nuevo-post");

    const canvas =
        document.getElementById("canvas-post");

    const drawingPreview =
        document.getElementById(
            "miiverse-drawing-ready"
        );

    /*
     * V21 FIX:
     * Once the user presses "Listo", the third drawing window closes.
     * The accepted preview is therefore the reliable source of truth.
     */
    if (
        drawingPreview &&
        drawingPreview.classList.contains(
            "active"
        )
    ) {
        return true;
    }

    if (!text || !canvas) {
        return false;
    }

    return (
        window.getComputedStyle(text).display === "none" &&
        window.getComputedStyle(canvas).display !== "none"
    );
}

function isRoleEnabled(map, uid) {
    return Boolean(
        uid &&
        map &&
        map[uid] === true
    );
}

function isOfficialAuthor(post) {
    return Boolean(
        post &&
        (
            String(post.autor || "") === MAKI_OWNER_PNID ||
            isRoleEnabled(makiChatAdmins, post.uid) ||
            isRoleEnabled(makiChatVerified, post.uid)
        )
    );
}

function currentUserCanModerate() {
    return Boolean(
        makiChatUser &&
        makiChatPnid === MAKI_OWNER_PNID
    );
}

function canDeletePost(post) {
    return Boolean(
        post &&
        currentUserCanModerate()
    );
}

function formatPostDate(post) {
    const timestamp =
        Number(post && post.createdAt);

    if (
        Number.isFinite(timestamp) &&
        timestamp > 0
    ) {
        try {
            return new Date(timestamp).toLocaleString();
        } catch (error) {
            // fallback below
        }
    }

    return String(
        (post && post.fecha) ||
        ""
    );
}

function roleLabel(post) {
    if (!post) {
        return "";
    }

    if (
        isRoleEnabled(
            makiChatAdmins,
            post.uid
        )
    ) {
        return "ADMIN";
    }

    if (
        String(post.autor || "") === MAKI_OWNER_PNID ||
        isRoleEnabled(
            makiChatVerified,
            post.uid
        )
    ) {
        return "VERIFIED";
    }

    return "";
}

function clearPostComposer() {
    const text =
        document.getElementById(
            "texto-nuevo-post"
        );

    if (text) {
        text.value = "";
    }

    const canvas =
        document.getElementById(
            "canvas-post"
        );

    if (canvas) {
        const context =
            canvas.getContext("2d");

        if (context) {
            context.clearRect(
                0,
                0,
                canvas.width,
                canvas.height
            );
        }
    }

    const spoiler =
        document.getElementById(
            "check-spoiler"
        );

    if (spoiler) {
        spoiler.checked = false;
    }

    if (
        typeof window.quitarImagenAdjuntaPost === "function"
    ) {
        window.quitarImagenAdjuntaPost();
    }

    if (
        typeof window.cerrarModalPostGeneral === "function"
    ) {
        window.cerrarModalPostGeneral();
    } else {
        const modal =
            document.getElementById(
                "modal-crear-post"
            );

        if (modal) {
            modal.style.display = "none";
        }

        document.body.style.overflow = "auto";
    }
}


/* ============================================================
   REAL PUBLIC POST
   ============================================================ */

window.publicarPostGeneral =
    async function() {
        if (!makiChatUser) {
            alert(
                "Debes iniciar sesión para publicar."
            );
            return;
        }

        const textarea =
            document.getElementById(
                "texto-nuevo-post"
            );

        const canvas =
            document.getElementById(
                "canvas-post"
            );

        const drawing =
            isDrawingMode();

        const attachedImage =
            getSelectedImageDataUrl();

        let tipo = "texto";
        let contenido = "";

        if (drawing) {
            tipo = "dibujo";

            if (!canvas) {
                alert(
                    "No se encontró el área de dibujo."
                );
                return;
            }

            contenido =
                typeof window.exportarDibujoPost === "function"
                    ? window.exportarDibujoPost()
                    : canvas.toDataURL("image/png");
        } else {
            contenido =
                textarea
                    ? textarea.value
                    : "";

            if (
                contenido.trim() === "" &&
                !attachedImage
            ) {
                alert(
                    "¡Escribe algo o adjunta una imagen!"
                );
                return;
            }
        }

        /*
         * V21 defensive guard:
         * A canvas export can NEVER be text. If contenido is a Data URL,
         * force the correct type before it reaches Firebase.
         */
        if (
            typeof contenido === "string" &&
            contenido.startsWith("data:image/")
        ) {
            tipo = "dibujo";
        }

        if (
            attachedImage &&
            attachedImage.length >
                MAX_PUBLIC_IMAGE_DATAURL
        ) {
            alert(
                "La imagen todavía pesa demasiado para el chat público. " +
                "Prueba con otra imagen o una más pequeña."
            );
            return;
        }

        const pnid =
            String(
                makiChatPnid ||
                localStorage.getItem(
                    "makiiverse_pnid"
                ) ||
                ""
            ).trim();

        if (!pnid) {
            alert(
                "No pude obtener tu PNID. Vuelve a iniciar sesión."
            );
            return;
        }

        const submit =
            document.querySelector(
                "#modal-crear-post button[onclick*='publicarPostGeneral']"
            );

        const previousText =
            submit
                ? submit.textContent
                : "";

        if (submit) {
            submit.disabled = true;
            submit.textContent = "Posting...";
        }

        try {
            const miiName = await resolveMiiName(pnid);

            const postRef =
                push(
                    ref(
                        makiChatDB,
                        "posts"
                    )
                );

            await set(
                postRef,
                {
                    uid: makiChatUser.uid,
                    publicId:
                        localStorage.getItem(
                            "makiiverse_public_id"
                        ) || "",
                    autor: pnid,
                    miiName: miiName,
                    tipo: tipo,
                    contenido: contenido,
                    imagenAdjunta:
                        attachedImage || null,
                    expresion:
                        getCurrentExpression(),
                    spoiler: Boolean(
                        document.getElementById(
                            "check-spoiler"
                        )?.checked
                    ),
                    createdAt:
                        serverTimestamp(),
                    fecha:
                        new Date()
                        .toLocaleString()
                }
            );

            clearPostComposer();

        } catch (error) {
            console.error(
                "No se pudo publicar en General Chat:",
                error
            );

            const code =
                error && error.code
                    ? error.code
                    : "UNKNOWN";

            alert(
                "No se pudo publicar el mensaje.\n\n" +
                "Firebase: " + code
            );
        } finally {
            if (submit) {
                submit.disabled = false;
                submit.textContent =
                    previousText ||
                    "Post";
            }
        }
    };


/* ============================================================
   DELETE / MODERATION
   ============================================================ */

window.eliminarMensaje =
    async function(postId) {
        const post =
            makiChatPosts.find(
                function(item) {
                    return item.id === postId;
                }
            );

        if (!post) {
            return;
        }

        if (!canDeletePost(post)) {
            alert(
                "No tienes permisos para borrar este mensaje."
            );
            return;
        }

        if (!confirm("¿Eliminar este mensaje del chat público?")) {
            return;
        }

        try {
            await remove(
                ref(
                    makiChatDB,
                    "posts/" + postId
                )
            );

            if (makiSelectedPostId === postId) {
                window.cerrarDetallePost();
            }

            /*
               También borramos sus Yeahs.
               Las reglas permiten esto solo a moderadores desde
               post_yeahs/{postId}; si no se puede, no bloqueamos
               el borrado principal.
            */
            if (currentUserCanModerate()) {
                try {
                    await remove(
                        ref(
                            makiChatDB,
                            "post_yeahs/" + postId
                        )
                    );
                } catch (yeahError) {
                    console.warn(
                        "El post se borró, pero no sus Yeahs:",
                        yeahError
                    );
                }
            }

        } catch (error) {
            console.error(
                "No se pudo borrar el post:",
                error
            );

            alert(
                "Firebase rechazó el borrado (" +
                (error.code || "UNKNOWN") +
                ")."
            );
        }
    };


/* ============================================================
   REAL SHARED YEAHS
   ============================================================ */

window.toggleYeah =
window.toggleYeahReal =
    async function(postId) {
        if (!makiChatUser) {
            return;
        }

        const userYeahRef =
            ref(
                makiChatDB,
                "post_yeahs/" +
                postId +
                "/" +
                makiChatUser.uid
            );

        const already =
            Boolean(
                makiChatYeahs?.[postId]?.[
                    makiChatUser.uid
                ]
            );

        try {
            if (already) {
                await remove(
                    userYeahRef
                );
            } else {
                const miiName =
                    await resolveMiiName(
                        makiChatPnid
                    );

                await set(
                    userYeahRef,
                    {
                        pnid: makiChatPnid,
                        publicId:
                            localStorage.getItem(
                                "makiiverse_public_id"
                            ) || "",
                        miiName: miiName,
                        givenAt: Date.now()
                    }
                );
            }
        } catch (error) {
            console.error(
                "No se pudo actualizar Yeah!:",
                error
            );
        }
    };


/* ============================================================
   REAL SHARED YEAHS — POSTS DE LA PÁGINA
   ============================================================ */

window.togglePageYeah = async function(postKey) {
    if (!makiChatUser) {
        alert("Debes iniciar sesión para dar Yeah!");
        return;
    }

    const key = String(postKey || "").replace(/[^a-zA-Z0-9_-]/g, "");
    if (!key) return;

    const userRef = ref(
        makiChatDB,
        "page_post_yeahs/" + key + "/" + makiChatUser.uid
    );

    const already = Boolean(makiPageYeahs?.[key]?.[makiChatUser.uid]);

    try {
        if (already) {
            await remove(userRef);
        } else {
            await set(userRef, true);
        }
    } catch (error) {
        console.error("No se pudo actualizar el Yeah de la página:", error);
    }
};

function renderPageYeahs() {
    document.querySelectorAll("[data-page-post]").forEach(function(button) {
        const key = button.getAttribute("data-page-post");
        const data = makiPageYeahs?.[key] || {};
        const count = Object.values(data).filter(Boolean).length;
        const active = Boolean(makiChatUser && data[makiChatUser.uid]);

        button.classList.toggle("active", active);

        const counter = document.querySelector(
            '[data-page-yeah-count="' + key + '"]'
        );
        if (counter) counter.textContent = String(count);
    });
}

function renderChatYeahControlsEverywhere() {
    document.querySelectorAll("[data-chat-yeah-post]").forEach(function(button) {
        const postId = button.getAttribute("data-chat-yeah-post");
        const data = makiChatYeahs?.[postId] || {};
        const count = Object.values(data).filter(Boolean).length;
        const active = Boolean(makiChatUser && data[makiChatUser.uid]);

        button.classList.toggle("active", active);

        const counter = document.querySelector(
            '[data-chat-yeah-count="' + postId + '"]'
        );
        if (counter) counter.textContent = String(count);
    });
}


/* ============================================================
   POST DETAIL / SELECTED POST
   ============================================================ */

function buildDetailContentHTML(post) {
    let html = "";

    if (
        String(post.contenido || "").startsWith("data:image/")
    ) {
        html += `
            <img
                class="maki-post-detail-image"
                src="${escapeChatHTML(post.contenido)}"
                alt="Drawing"
            >
        `;
    } else if (
        String(post.contenido || "").trim() !== ""
    ) {
        html += `
            <div>${escapeChatHTML(post.contenido || "")}</div>
        `;
    }

    if (
        post.imagenAdjunta &&
        String(post.imagenAdjunta).startsWith("data:image/")
    ) {
        html += `
            <img
                class="maki-post-detail-image"
                src="${escapeChatHTML(post.imagenAdjunta)}"
                alt="Attached image"
            >
        `;
    }

    if (!html) {
        html =
            '<div style="color:#999;text-align:center;">Empty post</div>';
    }

    if (post.spoiler) {
        html = `
            <details open>
                <summary style="
                    cursor:pointer;
                    color:#078fbe;
                    font-weight:bold;
                    margin-bottom:14px;
                ">Spoiler</summary>
                ${html}
            </details>
        `;
    }

    return html;
}


function findYeahPersonFallback(uid) {
    if (
        makiChatUser &&
        uid === makiChatUser.uid
    ) {
        return {
            pnid: makiChatPnid,
            publicId:
                localStorage.getItem(
                    "makiiverse_public_id"
                ) || "",
            miiName:
                makiMiiNameCache[makiChatPnid] ||
                makiChatPnid ||
                "User"
        };
    }

    const authoredPost =
        makiChatPosts.find(
            function(post) {
                return post.uid === uid;
            }
        );

    if (authoredPost) {
        return {
            pnid:
                authoredPost.autor || "",
            publicId:
                authoredPost.publicId || "",
            miiName:
                chatDisplayName(authoredPost)
        };
    }

    return {
        pnid: "",
        publicId: "",
        miiName: "User"
    };
}


async function getYeahPeople(postId) {
    const raw =
        makiChatYeahs?.[postId] ||
        {};

    const people =
        await Promise.all(
            Object.entries(raw).map(
                async function(entry) {
                    const uid =
                        entry[0];

                    const value =
                        entry[1];

                    let pnid = "";
                    let publicId = "";
                    let miiName = "";

                    /*
                       V12 Yeah:
                       {
                         pnid,
                         publicId,
                         miiName,
                         givenAt
                       }

                       Los Yeahs viejos eran simplemente true.
                    */
                    if (
                        value &&
                        typeof value === "object"
                    ) {
                        pnid =
                            String(
                                value.pnid || ""
                            );

                        publicId =
                            String(
                                value.publicId || ""
                            );

                        miiName =
                            String(
                                value.miiName || ""
                            );
                    }

                    if (!pnid) {
                        const fallback =
                            findYeahPersonFallback(
                                uid
                            );

                        pnid =
                            fallback.pnid;

                        publicId =
                            publicId ||
                            fallback.publicId;

                        miiName =
                            miiName ||
                            fallback.miiName;
                    }

                    if (
                        pnid &&
                        (
                            !miiName ||
                            miiName === pnid
                        )
                    ) {
                        miiName =
                            await resolveMiiName(
                                pnid
                            );
                    }

                    return {
                        uid: uid,
                        pnid: pnid,
                        publicId: publicId,
                        miiName:
                            miiName ||
                            pnid ||
                            "User"
                    };
                }
            )
        );

    return people;
}


async function renderYeahPeople(postId) {
    const container =
        document.getElementById(
            "maki-post-detail-people"
        );

    const countElement =
        document.getElementById(
            "maki-post-detail-yeah-count"
        );

    if (!container) {
        return;
    }

    const people =
        await getYeahPeople(
            postId
        );

    if (countElement) {
        countElement.textContent =
            String(people.length);
    }

    if (!people.length) {
        container.innerHTML =
            '<div class="maki-post-detail-empty-yeahs">' +
            'Nobody has given this post a Yeah! yet.' +
            '</div>';

        return;
    }

    container.innerHTML =
        people.map(
            function(person) {
                /*
                   La cara "happy" que mostraste corresponde en tu
                   propio selector al expression=like.
                */
                const miiUrl =
                    person.pnid
                        ? (
                            "https://mii-unsecure.ariankordi.net/miis/image.png" +
                            "?nnid=" +
                            encodeURIComponent(
                                person.pnid
                            ) +
                            "&type=face&width=270" +
                            "&expression=like" +
                            "&api_id=1"
                        )
                        : "img/games/Dummy_mii_user.png";

                return `
                    <div class="maki-yeah-person">
                        <div class="maki-yeah-person-mii">
                            <img
                                src="${escapeChatHTML(miiUrl)}"
                                alt=""
                                onerror="this.onerror=null;this.src='img/games/Dummy_mii_user.png';"
                            >
                        </div>

                        <div class="maki-yeah-person-name">
                            ${escapeChatHTML(person.miiName)}
                        </div>

                        <div class="maki-yeah-person-pnid">
                            ${escapeChatHTML(person.pnid || "Unknown user")}
                        </div>
                    </div>
                `;
            }
        ).join("");
}


function renderSelectedPostDetail() {
    const post =
        makiChatPosts.find(
            function(item) {
                return (
                    item.id ===
                    makiSelectedPostId
                );
            }
        );

    if (!post) {
        if (makiSelectedPostId) {
            window.cerrarDetallePost();
        }
        return;
    }

    const detail =
        document.getElementById(
            "maki-post-detail-card"
        );

    if (!detail) {
        return;
    }

    const expression =
        safeExpression(
            post.expresion
        );

    const miiUrl =
        "https://mii-unsecure.ariankordi.net/miis/image.png" +
        "?nnid=" +
        encodeURIComponent(
            post.autor || ""
        ) +
        "&type=face&width=270" +
        "&expression=" +
        encodeURIComponent(
            expression
        ) +
        "&api_id=1";

    const postYeahs =
        makiChatYeahs?.[
            post.id
        ] || {};

    const didYeah =
        Boolean(
            makiChatUser &&
            postYeahs[
                makiChatUser.uid
            ]
        );

    const yeahCount =
        Object.values(
            postYeahs
        ).filter(Boolean).length;

    const deleteButton =
        canDeletePost(post)
            ? `
                <button
                    id="maki-post-detail-delete"
                    type="button"
                    onclick="eliminarMensaje('${escapeChatHTML(post.id)}')"
                >
                    Eliminar
                </button>
            `
            : "";

    detail.innerHTML = `
        <article class="maki-post-detail-card">
            <header class="maki-post-detail-author">
                <div class="maki-post-detail-author-mii">
                    <img
                        src="${escapeChatHTML(miiUrl)}"
                        alt=""
                        onerror="this.onerror=null;this.src='img/games/Dummy_mii_user.png';"
                    >
                </div>

                <div class="maki-post-detail-author-info">
                    <div class="maki-post-detail-name">
                        ${escapeChatHTML(chatDisplayName(post))}
                    </div>

                    <div class="maki-post-detail-pnid">
                        ${escapeChatHTML(post.autor || "")}
                    </div>
                </div>

                <div class="maki-post-detail-date">
                    ${escapeChatHTML(formatPostDate(post))}
                </div>
            </header>

            <div class="maki-post-detail-content">
                ${buildDetailContentHTML(post)}
            </div>

            <footer class="maki-post-detail-actions">
                <button
                    type="button"
                    class="maki-post-detail-yeah-button ${didYeah ? "active" : ""}"
                    onclick="toggleYeahReal('${escapeChatHTML(post.id)}')"
                >
                    <span class="maki-yeah-icon">E</span>
                    <span>Yeah!</span>
                </button>

                <span class="maki-profile-yeah-count">
                    ${yeahCount}
                </span>

                ${deleteButton}
            </footer>
        </article>
    `;

    renderYeahPeople(
        post.id
    );
}


window.abrirDetallePost =
    function(postId) {
        const post =
            makiChatPosts.find(
                function(item) {
                    return item.id === postId;
                }
            );

        if (!post) {
            return;
        }

        makiSelectedPostId =
            postId;

        const overlay =
            document.getElementById(
                "maki-post-detail-overlay"
            );

        if (!overlay) {
            return;
        }

        overlay.classList.add(
            "open"
        );

        overlay.setAttribute(
            "aria-hidden",
            "false"
        );

        document.body.style.overflow =
            "hidden";

        renderSelectedPostDetail();
    };


window.cerrarDetallePost =
    function() {
        makiSelectedPostId =
            null;

        const overlay =
            document.getElementById(
                "maki-post-detail-overlay"
            );

        if (overlay) {
            overlay.classList.remove(
                "open"
            );

            overlay.setAttribute(
                "aria-hidden",
                "true"
            );
        }

        document.body.style.overflow =
            "auto";
    };


document.addEventListener(
    "click",
    function(event) {
        const overlay =
            document.getElementById(
                "maki-post-detail-overlay"
            );

        if (
            overlay &&
            event.target === overlay
        ) {
            window.cerrarDetallePost();
        }
    }
);


document.addEventListener(
    "keydown",
    function(event) {
        if (
            event.key === "Escape" &&
            makiSelectedPostId
        ) {
            window.cerrarDetallePost();
        }
    }
);


/* ============================================================
   RENDER
   ============================================================ */

function renderRealChat() {
    const wall =
        document.getElementById(
            "muro-mensajes"
        );

    if (!wall) {
        return;
    }

    wall.innerHTML = "";

    if (!makiChatPosts.length) {
        wall.innerHTML =
            '<div class="maki-chat-state">' +
            'Aún no hay publicaciones públicas. Sé la primera persona en escribir.' +
            '</div>';

        return;
    }

    makiChatPosts.forEach(
        function(post) {
            const expression =
                safeExpression(
                    post.expresion
                );

            const miiUrl =
                "https://mii-unsecure.ariankordi.net/miis/image.png" +
                "?nnid=" +
                encodeURIComponent(
                    post.autor || ""
                ) +
                "&type=face&width=270" +
                "&expression=" +
                encodeURIComponent(
                    expression
                ) +
                "&api_id=1";

            const official =
                isOfficialAuthor(post);

            const role =
                roleLabel(post);

            let contentHTML = "";

            if (
                String(post.contenido || "")
                .startsWith("data:image/")
            ) {
                contentHTML += `
                    <img
                        class="maki-chat-image"
                        src="${escapeChatHTML(post.contenido)}"
                        alt="Drawing"
                    >
                `;
            } else if (
                String(
                    post.contenido ||
                    ""
                ).trim() !== ""
            ) {
                contentHTML += `
                    <p style="
                        margin:0;
                        color:#333;
                        font-family:sans-serif;
                        font-size:21px;
                        line-height:1.7;
                        word-break:break-word;
                        white-space:pre-wrap;
                    ">${escapeChatHTML(post.contenido)}</p>
                `;
            }

            if (
                post.imagenAdjunta &&
                String(
                    post.imagenAdjunta
                ).startsWith("data:image/")
            ) {
                contentHTML += `
                    <img
                        class="maki-chat-image"
                        src="${escapeChatHTML(post.imagenAdjunta)}"
                        alt="Attached image"
                    >
                `;
            }

            if (
                post.spoiler &&
                contentHTML
            ) {
                contentHTML = `
                    <details>
                        <summary
                            style="
                                cursor:pointer;
                                color:#078fbe;
                                font-weight:bold;
                                margin-bottom:12px;
                            "
                        >
                            Spoiler — click to view
                        </summary>
                        ${contentHTML}
                    </details>
                `;
            }

            const postYeahs =
                makiChatYeahs?.[
                    post.id
                ] || {};

            const yeahCount =
                Object.values(
                    postYeahs
                ).filter(Boolean).length;

            const didYeah =
                Boolean(
                    makiChatUser &&
                    postYeahs[
                        makiChatUser.uid
                    ]
                );

            const card =
                document.createElement(
                    "div"
                );

            card.className =
                "miiverse-card";

            card.style.cssText =
                "display:flex;" +
                "align-items:flex-start;" +
                "gap:20px;" +
                "position:relative;" +
                "margin-bottom:20px;";

            card.innerHTML = `
                <div class="maki-chat-avatar">
                    <img
                        class="mii-face"
                        src="${escapeChatHTML(miiUrl)}"
                        alt=""
                        onerror="this.src='img/games/Dummy_mii_user.png';"
                    >

                    ${
                        official
                            ? `
                                <img
                                    class="maki-chat-verified"
                                    src="img/official-user.png"
                                    alt="Verified"
                                >
                            `
                            : ""
                    }
                </div>

                <div style="
                    flex:1;
                    min-width:0;
                    overflow:hidden;
                    position:relative;
                    border:1px solid #c8c8c8;
                    border-radius:8px;
                    background:#fff;
                    box-shadow:0 3px 6px rgba(0,0,0,.06);
                ">
                    <div
                        class="maki-chat-header"
                        style="
                            display:flex;
                            align-items:center;
                            justify-content:space-between;
                            min-height:58px;
                            padding:12px 20px;
                            border-bottom:1px solid #d0d0d0;
                            background:linear-gradient(to bottom,#f2f2f2,#e4e4e4);
                        "
                    >
                        <div class="maki-chat-name-row">
                            <span style="
                                min-width:0;
                                overflow:hidden;
                                color:#444;
                                font-family:sans-serif;
                                font-size:18px;
                                font-weight:bold;
                                text-overflow:ellipsis;
                                white-space:nowrap;
                            ">${escapeChatHTML(chatDisplayName(post))}</span>

                            ${
                                role
                                    ? `
                                        <span class="maki-chat-role">
                                            ${escapeChatHTML(role)}
                                        </span>
                                    `
                                    : ""
                            }
                        </div>

                        <div class="maki-chat-header-right">
                            <span style="
                                color:#888;
                                font-family:sans-serif;
                                font-size:12px;
                            ">${escapeChatHTML(formatPostDate(post))}</span>
                        </div>
                    </div>

                    <div
                        class="maki-chat-body"
                        style="
                            min-height:120px;
                            padding:30px 25px;
                            box-sizing:border-box;
                            background:#fff;
                        "
                    >
                        <div style="
                            display:flex;
                            align-items:flex-start;
                            gap:20px;
                        ">
                            <div
                                class="maki-chat-community-icon"
                                style="
                                    width:66px;
                                    height:66px;
                                    flex:0 0 66px;
                                    overflow:hidden;
                                    display:flex;
                                    align-items:center;
                                    justify-content:center;
                                    border:1px solid #222;
                                    border-radius:8px;
                                    background:linear-gradient(to bottom,#505050,#303030);
                                    box-shadow:inset 0 1px 2px rgba(255,255,255,.2);
                                "
                            >
                                <img
                                    src="img/games/wii-u-logo-png_seeklogo-312570.png"
                                    alt=""
                                    style="
                                        width:100%;
                                        height:100%;
                                        object-fit:cover;
                                    "
                                >
                            </div>

                            <div style="
                                min-width:0;
                                flex:1;
                            ">
                                ${contentHTML}
                            </div>
                        </div>
                    </div>

                    <div class="maki-chat-footer">
                        <button
                            type="button"
                            class="maki-chat-yeah ${didYeah ? "active" : ""}"
                            data-chat-yeah-post="${escapeChatHTML(post.id)}"
                            onclick="event.stopPropagation(); toggleYeahReal('${escapeChatHTML(post.id)}')"
                        >
                            <span class="maki-yeah-icon">E</span>
                            <span>Yeah!</span>
                        </button>
                        <span class="maki-profile-yeah-count" data-chat-yeah-count="${escapeChatHTML(post.id)}">${yeahCount}</span>

                        <span class="maki-chat-live-pill">
                            PUBLIC • LIVE
                        </span>
                    </div>
                </div>
            `;

            card.addEventListener(
                "click",
                function(event) {
                    if (
                        event.target.closest(
                            "button, a, input, label, summary, details"
                        )
                    ) {
                        return;
                    }

                    window.abrirDetallePost(
                        post.id
                    );
                }
            );

            wall.appendChild(card);
        }
    );

    if (makiSelectedPostId) {
        renderSelectedPostDetail();
    }
}


/*
   Sobrescribimos definitivamente las funciones viejas de localStorage.
*/
window.renderizarMensajes =
    function() {
        renderRealChat();
    };


/* ============================================================
   LIVE FIREBASE LISTENERS
   ============================================================ */

function objectFromSnapshot(snapshot) {
    return snapshot.exists()
        ? (snapshot.val() || {})
        : {};
}

function stopChatListeners() {
    [
        stopPosts,
        stopAdmins,
        stopVerified,
        stopYeahs,
        stopPageYeahs
    ].forEach(
        function(stop) {
            if (
                typeof stop === "function"
            ) {
                stop();
            }
        }
    );

    stopPosts = null;
    stopAdmins = null;
    stopVerified = null;
    stopYeahs = null;
    stopPageYeahs = null;
}

function startChatListeners() {
    stopChatListeners();

    const wall =
        document.getElementById(
            "muro-mensajes"
        );

    if (wall) {
        wall.innerHTML =
            '<div class="maki-chat-state">Connecting to public chat...</div>';
    }

    stopAdmins =
        onValue(
            ref(
                makiChatDB,
                "admins"
            ),
            function(snapshot) {
                makiChatAdmins =
                    objectFromSnapshot(
                        snapshot
                    );

                renderRealChat();
            }
        );

    stopVerified =
        onValue(
            ref(
                makiChatDB,
                "verified_users"
            ),
            function(snapshot) {
                makiChatVerified =
                    objectFromSnapshot(
                        snapshot
                    );

                renderRealChat();
            }
        );

    stopYeahs =
        onValue(
            ref(
                makiChatDB,
                "post_yeahs"
            ),
            function(snapshot) {
                makiChatYeahs = objectFromSnapshot(snapshot);
                renderRealChat();
                renderChatYeahControlsEverywhere();

                if (
                    typeof window.actualizarYeahsPerfilDesdeMapa === "function"
                ) {
                    window.actualizarYeahsPerfilDesdeMapa(
                        makiChatYeahs
                    );
                }

                if (makiSelectedPostId) {
                    renderSelectedPostDetail();
                }
            }
        );

    stopPageYeahs =
        onValue(
            ref(
                makiChatDB,
                "page_post_yeahs"
            ),
            function(snapshot) {
                makiPageYeahs = objectFromSnapshot(snapshot);
                renderPageYeahs();
            }
        );

    const postsQuery =
        query(
            ref(
                makiChatDB,
                "posts"
            ),
            orderByChild(
                "createdAt"
            ),
            limitToLast(
                MAX_CHAT_POSTS
            )
        );

    stopPosts =
        onValue(
            postsQuery,
            function(snapshot) {
                const items = [];

                snapshot.forEach(
                    function(child) {
                        items.push({
                            id: child.key,
                            ...(child.val() || {})
                        });
                    }
                );

                items.sort(
                    function(a, b) {
                        return (
                            Number(b.createdAt || 0) -
                            Number(a.createdAt || 0)
                        );
                    }
                );

                makiChatPosts = items;
                renderRealChat();
                hydrateMiiNames(items);
                renderChatYeahControlsEverywhere();
            },
            function(error) {
                console.error(
                    "General Chat listener error:",
                    error
                );

                if (wall) {
                    wall.innerHTML =
                        '<div class="maki-chat-state">' +
                        'No se pudo conectar con el chat público (' +
                        escapeChatHTML(error.code || "UNKNOWN") +
                        ').' +
                        '</div>';
                }
            }
        );
}


onAuthStateChanged(
    makiChatAuth,
    async function(user) {
        makiChatUser =
            user || null;

        makiChatPnid =
            String(
                localStorage.getItem(
                    "makiiverse_pnid"
                ) || ""
            );

        if (!user) {
            stopChatListeners();
            makiChatPosts = [];
            renderRealChat();
            return;
        }

        /*
           Tomamos el PNID desde users/{uid}.
           Así el autor coincide con las reglas de seguridad,
           no solo con localStorage.
        */
        try {
            const snapshot =
                await get(
                    ref(
                        makiChatDB,
                        "users/" + user.uid
                    )
                );

            if (
                snapshot.exists() &&
                snapshot.val().pnid
            ) {
                makiChatPnid =
                    String(
                        snapshot.val().pnid
                    );

                localStorage.setItem(
                    "makiiverse_pnid",
                    makiChatPnid
                );
            }
        } catch (error) {
            console.warn(
                "No se pudo leer el PNID del usuario:",
                error
            );
        }

        startChatListeners();
    }
);
