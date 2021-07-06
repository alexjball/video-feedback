from feedback.portal import Portal

def test_portal():
    p = Portal()
    p.add_region([
        (-1, -1),
        (1, -1),
        (1, 1),
        (-1, 1)
    ])

    assert p.contains((0, 0))
    assert p.contains((.5, .5))
    assert not p.contains((2, 0))
    assert not p.contains((-2, 0.5))