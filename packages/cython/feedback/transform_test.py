from feedback.portal import Transform
import numpy as np


def test_init():
    a = Transform(t_y=3)
    assert a.m[1, 2] == 3


def test_transform_points():
    a = Transform(t_y=3)
    p = np.array([0, 0, 1]).T

    p_t = a @ p

    assert p_t[0] == 0
    assert p_t[1] == 3
    assert p_t[2] == 1


def test_inverse():
    a = Transform(t_y=3)
    expected_inverse = Transform(t_y=-3)
    p = np.array([0, 0, 1]).T

    ~a

    actual = a @ p
    expected = expected_inverse @ p

    assert (actual == expected).all()


def test_compose_transforms():
    a1 = Transform(s_y=2, t_y=3)
    a2 = Transform(degrees=90)
    combined = Transform()
    p = np.array([0, 5, 1]).T

    combined @ a1 @ a2
    p_t = combined @ p

    expected = np.array([-5, 3, 1])
    assert np.allclose(p_t, expected)


def test_array():
    a = Transform(s_y=2, t_y=3)
    m = np.array(a)
    assert (m == a.m).all()


def test_set():
    a = Transform()

    a.set(t_y=3)
    p = a @ np.array([0, 0, 1]).T

    assert (p == [0, 3, 1]).all()


def test_capply():
    a = Transform(t_y=3)

    p = np.array([0, 0, 1]).T

    expected = a @ p
    actual = a.capply((p[0], p[1]))

    assert expected[0] == actual[0]
    assert expected[1] == actual[1]
