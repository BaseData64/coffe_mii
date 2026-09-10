/* ============================================================
   MAKI'S BIO V23 — extracted from index.html
   Original inline script #07
   Mode: classic script
   ============================================================ */

(function () {


    var buttons =
        document.querySelectorAll(
            "#vista-networks [data-copy-network]"
        );


    function fallbackCopy(text) {


        var textarea =
            document.createElement(
                "textarea"
            );


        textarea.value =
            text;


        textarea.style.position =
            "fixed";


        textarea.style.left =
            "-9999px";


        document.body.appendChild(
            textarea
        );


        textarea.focus();
        textarea.select();


        try {

            document.execCommand(
                "copy"
            );

        }

        catch (error) {

            console.error(
                "[Networks] Copy failed:",
                error
            );

        }


        document.body.removeChild(
            textarea
        );

    }


    function showCopied(button) {


        var oldText =
            button.textContent;


        button.textContent =
            "COPIED!";


        button.classList.add(
            "copied"
        );


        setTimeout(

            function () {


                button.textContent =
                    oldText;


                button.classList.remove(
                    "copied"
                );

            },

            1200

        );

    }


    buttons.forEach(

        function (button) {


            button.addEventListener(

                "click",

                function () {


                    var value =
                        button.getAttribute(
                            "data-copy-network"
                        );


                    if (!value) {
                        return;
                    }


                    if (
                        navigator.clipboard
                        &&
                        navigator.clipboard.writeText
                    ) {


                        navigator.clipboard
                            .writeText(value)

                            .then(

                                function () {

                                    showCopied(
                                        button
                                    );

                                }

                            )

                            .catch(

                                function () {

                                    fallbackCopy(
                                        value
                                    );


                                    showCopied(
                                        button
                                    );

                                }

                            );

                    }


                    else {


                        fallbackCopy(
                            value
                        );


                        showCopied(
                            button
                        );

                    }

                }

            );

        }

    );

})();
