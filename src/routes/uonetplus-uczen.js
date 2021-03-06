const express = require('express');
const router = express.Router();
const protocol = require('../utils/connection');
const dictMap = require('../utils/dictMap');
const converter = require('../utils/converter');
const Tokens = require('csrf');
const _ = require('lodash');
const {format, fromUnixTime, getYear, addYears, addMonths, addDays, differenceInDays, parseISO} = require('date-fns');

router.get("/", (req, res) => {
    const base = protocol(req) + "://" + req.get('host') + "/Default/123456";
    res.json({
        status: "sucess",
        data: {
            endpoints: [
                "/Diety.mvc/Get",
                "/EgzaminySemestralne.mvc/Get",
                "/EgzaminyZewnetrzne.mvc/Get",
                "/EwidencjaObecnosci.mvc/Get",
                "/FormularzeSzablony.mvc/Get",
                "/FormularzeSzablonyDownload.mvc/Get",
                "/FormularzeWysylanie.mvc/Get",
                "/FormularzeWysylanie.mvc/Post",
                "/Frekwencja.mvc/Get",
                "/FrekwencjaStatystyki.mvc/Get",
                "/FrekwencjaStatystykiPrzedmioty.mvc/Get",
                "/Jadlospis.mvc/Get",
                "/LekcjeZrealizowane.mvc/GetPrzedmioty",
                "/LekcjeZrealizowane.mvc/GetZrealizowane",
                "/Oceny.mvc/Get",
                "/OkresyUmowOplat.mvc/Get",
                "/Oplaty.mvc/Get",
                "/PlanZajec.mvc/Get",
                "/Pomoc.mvc/Get",
                "/RejestracjaUrzadzeniaToken.mvc/Get",
                "/RejestracjaUrzadzeniaToken.mvc/Delete",
                "/RejestracjaUrzadzeniaTokenCertyfikat.mvc/Get",
                "/Sprawdziany.mvc/Get",
                "/Statystyki.mvc/GetOcenyCzastkowe",
                "/Statystyki.mvc/GetOcenyRoczne",
                "/Statystyki.mvc/GetPunkty",
                "/SzkolaINauczyciele.mvc/Get",
                "/Uczen.mvc/Get",
                "/UczenCache.mvc/Get",
                "/UczenDziennik.mvc/Get",
                "/Usprawiedliwienia.mvc/Post",
                "/UwagiIOsiagniecia.mvc/Get",
                "/ZadaniaDomowe.mvc/Get",
                "/ZarejestrowaneUrzadzenia.mvc/Get",
                "/ZarejestrowaneUrzadzenia.mvc/Delete",
                "/ZgloszoneNieobecnosci.mvc/Get",
                "/ZgloszoneNieobecnosci.mvc/Post"
            ].map(item => {
                return base + item;
            })
        }
    });
});

router.get("/Start", (req, res) => {
    res.render("uczen/start");
});

router.all("/UczenCache.mvc/Get", (req, res) => {
    res.json({
        "data": {
            "czyOpiekun": false,
            "czyJadlospis": false,
            "czyOplaty": false,
            "poryLekcji": require("../../data/api/dictionaries/PoryLekcji").map(item => {
                return {
                    Id: item.Id,
                    Numer: item.Numer,
                    Poczatek: "1900-01-01 " + item.PoczatekTekst + ":00",
                    Koniec: "1900-01-01 " + item.KoniecTekst + ":00",
                    DataModyfikacji: "1900-01-01 00:00:00",
                    IdJednostkaSprawozdawcza: 1,
                    Nazwa: "" + item.Numer,
                    OkresDataOd: fromUnixTime(item.OkresDataOd)
                };
            }),
            "pokazLekcjeZrealizowane": true,
            "serverDate": format(new Date(), 'yyyy-MM-dd HH:mm:ss')
        }, "success": true,
    });
});

router.all("/UczenDziennik.mvc/Get", (req, res) => {
    res.json({
        "data": require('../../data/api/ListaUczniow').reduce((res, current) => {
            return res.concat(Array(current.OkresPoziom).fill(current)).map((item, i, array) => {
                return {
                    // jshint ignore:start
                    ...item,
                    // jshint ignore:end
                    OkresPoziom: i + 1 - 4,
                    IdOkresKlasyfikacyjny: (i + 1) * 2,
                    year: getYear(fromUnixTime(item.OkresDataOd)) + i - array.length + 1,
                    OkresDataOd: addYears(fromUnixTime(item.OkresDataOd), i - array.length + 1),
                    OkresDataDo: addYears(fromUnixTime(item.OkresDataDo), i - array.length + 1)
                };
            }).reverse();
        }, []).map(item => {
            return {
                Id: item.OkresPoziom,
                IdUczen: item.Id,
                UczenImie: item.Imie,
                UczenImie2: item.Imie2,
                UczenNazwisko: item.Nazwisko,
                IsDziennik: true,
                IdDziennik: (item.OkresNumer === 1 ? item.IdOkresKlasyfikacyjny : item.IdOkresKlasyfikacyjny - 1),
                IdPrzedszkoleDziennik: 0,
                Poziom: item.OkresPoziom,
                Symbol: item.OddzialSymbol,
                Nazwa: null,
                DziennikRokSzkolny: item.year,
                Okresy: [
                    item.OkresNumer === 1 ? item.IdOkresKlasyfikacyjny : item.IdOkresKlasyfikacyjny - 1,
                    item.OkresNumer === 2 ? item.IdOkresKlasyfikacyjny : item.IdOkresKlasyfikacyjny + 1
                ].map((semesterId, i) => {
                    return {
                        NumerOkresu: i + 1,
                        Poziom: item.OkresPoziom,
                        DataOd: format(addMonths(item.OkresDataOd, i * 5), 'yyyy-MM-dd HH:mm:ss'),
                        DataDo: format(addMonths(item.OkresDataDo, i * 7), 'yyyy-MM-dd HH:mm:ss'),
                        IdOddzial: item.IdOddzial,
                        IdJednostkaSprawozdawcza: item.IdJednostkaSprawozdawcza,
                        IsLastOkres: i === 1,
                        Id: semesterId
                    };
                }),
                "IdSioTyp": 11,
                "IsDorosli": false,
                "IsPolicealna": false,
                "Is13": false,
                "IsArtystyczna": false,
                "IsArtystyczna13": false,
                "IsSpecjalny": false,
                "IsPrzedszkola": false,
                "UczenPelnaNazwa": `${item.OkresPoziom}${item.OddzialSymbol} ${item.year} - ${item.Imie} ${item.Nazwisko}`
            };
        }),
        "success": true
    });
});

router.all("/Home.mvc/RefreshSession", (req, res) => {
    res.json({
        "data": {},
        "success": true
    });
});

router.all("/Diety.mvc/Get", (req, res) => {
    res.json({
        "data": {},
        "success": true
    });
});

router.all("/EgzaminySemestralne.mvc/Get", (req, res) => {
    res.json({
        "data": {},
        "success": true
    });
});

router.all("/EgzaminyZewnetrzne.mvc/Get", (req, res) => {
    res.json({
        "data": {},
        "success": true
    });
});

router.all("/EwidencjaObecnosci.mvc/Get", (req, res) => {
    res.json({
        "data": {},
        "success": true
    });
});

router.all("/FormularzeSzablony.mvc/Get", (req, res) => {
    res.json({
        "data": {},
        "success": true
    });
});

router.all("/FormularzeSzablonyDownload.mvc/Get", (req, res) => {
    res.json({
        "data": {},
        "success": true
    });
});

router.all("/FormularzeWysylanie.mvc/Get", (req, res) => {
    res.json({
        "data": {},
        "success": true
    });
});

router.all("/FormularzeWysylanie.mvc/Post", (req, res) => {
    res.json({
        "data": {},
        "success": true
    });
});

router.all("/Frekwencja.mvc/Get", (req, res) => {
    const attendance = require("../../data/api/student/Frekwencje");
    res.json({
        "data": {
            "UsprawiedliwieniaAktywne": false,
            "Dni": [],
            "UsprawiedliwieniaWyslane": [],
            "Frekwencje": attendance.map((item) => {
                let offset = (new Date(item.DzienTekst)).getDay() - (new Date(attendance[0].DzienTekst).getDay());
                let date;
                if (req.body.data) {
                    date = converter.formatDate(addDays(new Date(req.body.data.replace(" ", "T").replace(/Z$/, '') + "Z"), offset), true);
                } else date = item.DzienTekst;
                return {
                    "IdKategoria": item.IdKategoria,
                    "NrDnia": item.Numer,
                    "Symbol": "/",
                    "SymbolImage": "data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==",
                    "PrzedmiotNazwa": item.PrzedmiotNazwa,
                    "IdPoraLekcji": item.IdPoraLekcji,
                    "Data": `${date} 00:00:00`,
                    "LekcjaOddzialId": item.Dzien * item.Numer
                };
            })
        },
        "success": true
    });
});

router.all("/FrekwencjaStatystyki.mvc/Get", (req, res) => {
    const attendance = require("../../data/opiekun/frekwencja-statystyki");
    const sumStats = require("../../data/opiekun/frekwencja-statystyki").reduce((prev, current) => {
        return {
            presence: prev.presence + current.presence,
            absence: prev.absence + current.absence,
            absenceExcused: prev.absenceExcused + current.absenceExcused,
            absenceForSchoolReasons: prev.absenceForSchoolReasons + current.absenceForSchoolReasons,
            lateness: prev.lateness + current.lateness,
            latenessExcused: prev.latenessExcused + current.latenessExcused,
            exemption: prev.exemption + current.exemption
        };
    });

    res.json({
        "data": {
            "Podsumowanie": Math.round((
                (sumStats.presence + sumStats.lateness + sumStats.latenessExcused) /
                (sumStats.presence +
                    sumStats.absence +
                    sumStats.absenceExcused +
                    sumStats.absenceForSchoolReasons +
                    sumStats.lateness +
                    sumStats.latenessExcused)
            ) * 10000) / 100,
            "Statystyki": [...Array(7).keys()].map(j => {
                const name = i => {
                    switch (i) {
                        case 0:
                            return "Obecność";
                        case 1:
                            return "Nieobecność nieusprawiedliwiona";
                        case 2:
                            return "Nieobecność usprawiedliwiona";
                        case 3:
                            return "Nieobecność z przyczyn szkolnych";
                        case 4:
                            return "Spóźnienie nieusprawiedliwione";
                        case 5:
                            return "Spóźnienie usprawiedliwione";
                        case 6:
                            return "Zwolnienie";
                    }
                };
                const value = (month, i) => {
                    switch (i) {
                        case 0:
                            return attendance[month].presence;
                        case 1:
                            return attendance[month].absence;
                        case 2:
                            return attendance[month].absenceExcused;
                        case 3:
                            return attendance[month].absenceForSchoolReasons;
                        case 4:
                            return attendance[month].lateness;
                        case 5:
                            return attendance[month].latenessExcused;
                        case 6:
                            return attendance[month].exemption;
                    }
                };
                return {
                    "Id": j + 1,
                    "NazwaTypuFrekwencji": name(j),
                    "Wrzesien": value(0, j),
                    "Pazdziernik": value(1, j),
                    "Listopad": value(2, j),
                    "Grudzien": value(3, j),
                    "Styczen": value(4, j),
                    "Luty": value(5, j),
                    "Marzec": value(6, j),
                    "Kwiecien": value(7, j),
                    "Maj": value(8, j),
                    "Czerwiec": value(9, j),
                    "Lipiec": value(10, j),
                    "Sierpien": value(11, j),
                    "Razem": 0
                };
            })
        },
        "success": true
    });
});

router.all("/FrekwencjaStatystykiPrzedmioty.mvc/Get", (req, res) => {
    const subjects = require("../../data/api/dictionaries/Przedmioty").map(item => {
        return {
            "Id": item.Id,
            "Nazwa": item.Nazwa
        };
    });
    subjects.unshift({
        "Id": -1,
        "Nazwa": "Wszystkie"
    });
    subjects.push({
        "Id": 0,
        "Nazwa": "Brak opisu lekcji"
    }, {
        "Id": 492,
        "Nazwa": "Opieka nad uczniami"
    });
    res.json({
        "data": subjects,
        "success": true
    });
});

router.all("/Jadlospis.mvc/Get", (req, res) => {
    res.json({
        "data": {},
        "success": true
    });
});

router.all("/LekcjeZrealizowane.mvc/GetPrzedmioty", (req, res) => {
    const subjects = require("../../data/api/dictionaries/Przedmioty").map(item => {
        return {
            "IdPrzedmiot": item.Id,
            "Nazwa": item.Nazwa
        };
    });
    subjects.unshift({
        "IdPrzedmiot": -1,
        "Nazwa": "Wszystkie"
    });
    res.json({
        "data": subjects,
        "success": true
    });
});

router.all("/LekcjeZrealizowane.mvc/GetZrealizowane", (req, res) => {
    const realized = require("../../data/opiekun/plan-zrealizowane.json");
    const requestDate = req.body.poczatek ? parseISO(req.body.poczatek.replace("T", " ").replace(/Z$/, '')) : parseISO(realized[0].date);
    const baseOffset = differenceInDays(requestDate, parseISO(realized[0].date));

    res.json({
        "data": _.groupBy(realized.map(item => {
            return {
                "Data": `${converter.formatDate(addDays(parseISO(item.date), baseOffset), true)} 00:00:00`,
                "Przedmiot": item.subject,
                "NrLekcji": item.number,
                "Temat": item.topic,
                "Nauczyciel": `${item.teacher} [${item.teacherSymbol}]`,
                "Zastepstwo": "",
                "Nieobecnosc": item.absence,
                "PseudonimUcznia": null,
                "ZasobyPubliczne": "",
                "PrzedmiotDisplay": item.subject
            };
        }), item => converter.formatDate(new Date(item.Data))),
        "success": true
    });
});

router.all("/Oceny.mvc/Get", (req, res) => {
    const summary = require("../../data/api/student/OcenyPodsumowanie");
    const teachers = require("../../data/api/dictionaries/Nauczyciele");
    const subjectCategories = require("../../data/api/dictionaries/KategorieOcen");

    res.json({
        "data": {
            "IsSrednia": false,
            "IsPunkty": false,
            "Oceny": require("../../data/api/dictionaries/Przedmioty").map(item => {
                return {
                    "Przedmiot": item.Nazwa,
                    "Pozycja": item.Pozycja,
                    "OcenyCzastkowe": require("../../data/api/student/Oceny").filter(grade => grade.IdPrzedmiot === item.Id).map(item => {
                        const teacher = dictMap.getByValue(teachers, "Id", item.IdPracownikD);
                        return {
                            "Nauczyciel": `${teacher.Imie} ${teacher.Nazwisko}`,
                            "Wpis": item.Wpis,
                            "Waga": Math.round(item.WagaOceny),
                            "NazwaKolumny": item.Opis,
                            "KodKolumny": dictMap.getByValue(subjectCategories, "Id", item.IdKategoria).Kod,
                            "DataOceny": converter.formatDate(new Date(item.DataUtworzenia * 1000)),
                            "KolorOceny": 0
                        };
                    }),
                    "ProponowanaOcenaRoczna": dictMap.getByValue(summary.OcenyPrzewidywane, "IdPrzedmiot", item.Id, {"Wpis": ""}).Wpis,
                    "OcenaRoczna": dictMap.getByValue(summary.OcenyPrzewidywane, "IdPrzedmiot", item.Id, {"Wpis": ""}).Wpis,
                    "ProponowanaOcenaRocznaPunkty": null,
                    "OcenaRocznaPunkty": null,
                    "Srednia": dictMap.getByValue(summary.SrednieOcen, "IdPrzedmiot", item.Id, {"Wpis": 0}).Wpis,
                    "SumaPunktow": null,
                    "WidocznyPrzedmiot": false
                };
            }),
            "OcenyOpisowe": [],
            "TypOcen": 2,
            "IsOstatniSemestr": false,
            "IsDlaDoroslych": false
        },
        "success": true
    });
});

router.all("/OkresyUmowOplat.mvc/Get", (req, res) => {
    res.json({
        "data": {},
        "success": true
    });
});

router.all("/Oplaty.mvc/Get", (req, res) => {
    res.json({
        "data": {},
        "success": true
    });
});

router.all("/PlanZajec.mvc/Get", (req, res) => {
    res.json({
        "data": {},
        "success": true
    });
});

router.all("/Pomoc.mvc/Get", (req, res) => {
    res.json({
        "data": {},
        "success": true
    });
});

router.all("/RejestracjaUrzadzeniaToken.mvc/Get", (req, res) => {
    const student = require('../../data/api/ListaUczniow')[1];
    const base = protocol(req) + "://" + req.get('host');
    const token = new Tokens({secretLength: 97, saltLength: 4});
    const secret = token.secretSync();
    res.json({
        "data": {
            "TokenId": 423,
            "TokenKey": "FK100000",
            "CustomerGroup": "Default",
            "CustomerSymbol": student.JednostkaSprawozdawczaSymbol,
            "QrCodeContent": `CERT#${base}/Default/mobile-api#FK100000#ENDCERT`,
            "QrCodeContentEncoded": "xxx", // TODO: create and use qr encrypt
            "QrCodeImage": "<img src=\"data:image/png;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==\" alt=\"Kod QR\" title=\"Kod QR\" height=\"400\" width=\"400\" />",
            "ImageSize": 400,
            "IdLogin": student.UzytkownikLoginId,
            "LoginValue": student.UzytkownikLogin,
            "PIN": "999999",
            "AntiForgeryAppGuid": secret,
            "AntiForgeryToken": token.create(secret)
        },
        "success": true
    });
});

router.all("/RejestracjaUrzadzeniaToken.mvc/Delete", (req, res) => {
    res.json({
        "data": {},
        "success": true
    });
});

router.all("/RejestracjaUrzadzeniaTokenCertyfikat.mvc/Get", (req, res) => {
    res.json({
        "data": true,
        "success": true
    });
});

router.all("/Sprawdziany.mvc/Get", (req, res) => {
    const subjects = require("../../data/api/dictionaries/Przedmioty");
    const teachers = require("../../data/api/dictionaries/Nauczyciele");
    const exams = require("../../data/api/student/Sprawdziany");
    const requestDate = req.body.data ? parseISO(req.body.data.replace("T", " ").replace(/Z$/, '')) : parseISO(exams[0].DataTekst);
    const baseOffset = differenceInDays(requestDate, parseISO(exams[0].DataTekst));

    res.json({
        "data": [...Array(4).keys()].map(function (j) {
            return {
                "SprawdzianyGroupedByDayList": converter.getWeekDaysFrom(addDays(requestDate, (7 * j)), 7).map((day, i) => {
                    return {
                        "Data": converter.formatDate(day[2], true) + " 00:00:00",
                        "Sprawdziany": exams.filter(exam => {
                            return 0 === differenceInDays(day[2], addDays(parseISO(exam.DataTekst), baseOffset + (7 * j)));
                        }).map(item => {
                            const subject = dictMap.getByValue(subjects, "Id", item.IdPrzedmiot);
                            const teacher = dictMap.getByValue(teachers, "Id", item.IdPracownik);

                            return {
                                "DisplayValue": `${subject.Nazwa} ${res.locals.userInfo.OddzialKod}${item.PodzialSkrot ? "|" + item.PodzialSkrot : ""}`,
                                "PracownikModyfikujacyDisplay": `${teacher.Imie} ${teacher.Nazwisko} [${teacher.Kod}]`,
                                "DataModyfikacji": `1970-01-01 00:00:00`,
                                "Opis": item.Opis,
                                "Rodzaj": item.Rodzaj ? 1 : 0
                            };
                        }),
                        "Pokazuj": i < 5
                    };
                })
            };
        }),
        "success": true
    });
});

router.all("/Statystyki.mvc/GetOcenyCzastkowe", (req, res) => {
    res.json({
        "data": {},
        "success": true
    });
});

router.all("/Statystyki.mvc/GetOcenyRoczne", (req, res) => {
    res.json({
        "data": {},
        "success": true
    });
});

router.all("/Statystyki.mvc/GetPunkty", (req, res) => {
    res.json({
        "data": {},
        "success": true
    });
});

router.all("/SzkolaINauczyciele.mvc/Get", (req, res) => {
    const teachers = require("../../data/api/student/Nauczyciele");
    const subjectsDict = require("../../data/api/dictionaries/Przedmioty");
    const teachersDict = require("../../data/api/dictionaries/Pracownicy");

    const headmaster = dictMap.getByValue(teachersDict, "Id", teachers.NauczycieleSzkola[0].IdPracownik);
    const tutor = dictMap.getByValue(teachersDict, "Id", teachers.NauczycieleSzkola[3].IdPracownik);
    res.json({
        "data": {
            "Szkola": {
                "Nazwa": res.locals.userInfo.JednostkaNazwa,
                "Adres": "",
                "Kontakt": "",
                "Dyrektor": `${headmaster.Imie} ${headmaster.Nazwisko}`,
                "Pedagog": `${tutor.Imie} ${tutor.Nazwisko}`,
                "Id": 0
            },
            "Nauczyciele": require("../../data/api/student/Nauczyciele").NauczycielePrzedmioty.map(item => {
                const teacher = dictMap.getByValue(teachersDict, "Id", item.IdPracownik);
                return {
                    "Nazwa": dictMap.getByValue(subjectsDict, "Id", item.IdPrzedmiot).Nazwa,
                    "Nauczyciel": `${teacher.Imie} ${teacher.Nazwisko} [${teacher.Kod}]`,
                    "Id": 0
                };
            })
        },
        "success": true
    });
});

router.all("/Uczen.mvc/Get", (req, res) => {
    res.json({
        "data": {},
        "success": true
    });
});

router.all("/Usprawiedliwienia.mvc/Post", (req, res) => {
    res.json({
        "data": {},
        "success": true
    });
});

router.all("/UwagiIOsiagniecia.mvc/Get", (req, res) => {
    const categories = require("../../data/api/dictionaries/KategorieUwag");
    const teachers = require("../../data/api/dictionaries/Pracownicy");
    res.json({
        "data": {
            "Uwagi": require("../../data/api/student/UwagiUcznia").map(item => {
                return {
                    "TrescUwagi": item.TrescUwagi,
                    "Kategoria": dictMap.getByValue(categories, "Id", item.IdKategoriaUwag).Nazwa,
                    "DataWpisu": format(fromUnixTime(item.DataWpisu), 'yyyy-MM-dd HH:mm:ss'),
                    "Nauczyciel": `${item.PracownikImie} ${item.PracownikNazwisko} [${dictMap.getByValue(teachers, "Id", item.IdPracownik).Kod}]`
                };
            }),
            "Osiagniecia": []
        },
        "success": true
    });
});

router.all("/ZadaniaDomowe.mvc/Get", (req, res) => {
    const subjects = require("../../data/api/dictionaries/Przedmioty");
    const teachers = require("../../data/api/dictionaries/Nauczyciele");
    const homework = require("../../data/api/student/ZadaniaDomowe");
    const requestDate = req.body.data ? parseISO(req.body.data.replace("T", " ").replace(/Z$/, '')) : parseISO(homework[0].DataTekst);
    // const baseOffset = differenceInDays(requestDate, parseISO(homework[0].DataTekst));

    res.json({
        "data": [...Array(7).keys()].map(j => {
            return {
                "Data": converter.formatDate(addDays(requestDate, j), true) + " 00:00:00",
                "ZadaniaDomowe": homework.filter(item => {
                    return j < 5;
                    // return 0 === differenceInDays(addDays(requestDate, j), addDays(parseISO(item.DataTekst), baseOffset));
                }).map(item => {
                    const teacher = dictMap.getByValue(teachers, "Id", item.IdPracownik);
                    return {
                        "Przedmiot": dictMap.getByValue(subjects, "Id", item.IdPrzedmiot).Nazwa,
                        "Pracownik": `${teacher.Imie} ${teacher.Nazwisko} [${teacher.Kod}], ${converter.formatDate(new Date(item.DataTekst))}`,
                        "Opis": item.Opis,
                        "DataModyfikacji": converter.formatDate(new Date(item.DataTekst), true) + " 00:00:00"
                    };
                }),
                "Pokazuj": j < 5
            };
        }),
        "success": true
    });
});

router.all("/ZarejestrowaneUrzadzenia.mvc/Get", (req, res) => {
    res.json({
        "data": require("../../data/opiekun/zarejestrowane-urzadzenia"),
        "success": true
    });
});

router.all("/ZarejestrowaneUrzadzenia.mvc/Delete", (req, res) => {
    res.json({
        "data": null,
        "success": true
    });
});

router.all("/ZgloszoneNieobecnosci.mvc/Get", (req, res) => {
    res.json({
        "data": {},
        "success": true
    });
});

router.all("/ZgloszoneNieobecnosci.mvc/Post", (req, res) => {
    res.json({
        "data": {},
        "success": true
    });
});

module.exports = router;
